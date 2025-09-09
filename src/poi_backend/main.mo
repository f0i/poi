import Principal "mo:base/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import Blob "mo:base/Blob";
import IC "ic:aaaaa-aa";
import Json "mo:json";

persistent actor {
  // External canister types
  type Provider = { #github; #twitter; #discord; #google; #auth0; #zitadel; #x };
  type User = {
    id : Text;
    bio : ?Text;
    verified : ?Bool;
    username : ?Text;
    provider : Provider;
    provider_created_at : ?Text;
    avatar_url : ?Text;
    name : ?Text;
    createdAt : Time.Time;
    origin : Text;
    following_count : ?Nat;
    public_gists : ?Nat;
    email : ?Text;
    website : ?Text;
    tweet_count : ?Nat;
    public_repos : ?Nat;
    email_verified : ?Bool;
    followers_count : ?Nat;
    location : ?Text;
  };

  // Cached user data with timestamp
  type CachedUser = {
    user : User;
    timestamp : Time.Time;
    ttl : Nat; // Time to live in seconds (24 hours = 86400)
  };

  // Challenge types
  type ChallengeType = {
    #follows : { user : Text };
  };

  type Challenge = {
    id : Nat;
    description : Text;
    challengeType : ChallengeType;
  };

  // Storage for cached user data
  private stable var userDataStore : Trie.Trie<Principal, CachedUser> = Trie.empty();

  // Storage for challenges
  private stable var challenges : [Challenge] = [];

  // Challenge ID counter
  private var nextChallengeId : Nat = 0;

  // External canister ID
  private let USER_DATA_CANISTER_ID = "fhzgg-waaaa-aaaah-aqzvq-cai";

  // Apify API Bearer Token (write-only, no getter)
  private stable var apifyBearerToken : Text = "";

  // Apify cookies string
  private stable var apifyCookies : Text = "";

  // Challenge status storage: Principal -> ChallengeId -> Status
  private stable var challengeStatuses : Trie.Trie<Principal, Trie.Trie<Nat, { #pending; #verified; #failed : Text }>> = Trie.empty();

  // Followers storage: TargetUserId -> Array of FollowerIds
  private stable var followersCache : [(Text, [Text])] = [];

  // Challenge status type for external use
  public type ChallengeStatus = {
    #pending;
    #verified;
    #failed : Text;
  };

  // Apify API response types
  type ApifyRunResponse = {
    data : ApifyRunData;
  };

  type ApifyRunData = {
    id : Text;
    actId : Text;
    userId : Text;
    startedAt : Text;
    finishedAt : ?Text;
    status : Text;
    meta : ApifyMeta;
    stats : ApifyStats;
    options : ApifyOptions;
    buildId : Text;
    defaultKeyValueStoreId : Text;
    defaultDatasetId : Text;
    defaultRequestQueueId : Text;
    pricingInfo : ApifyPricingInfo;
    platformUsageBillingModel : Text;
    generalAccess : Text;
    buildNumber : Text;
    containerUrl : Text;
  };

  type ApifyMeta = {
    origin : Text;
    userAgent : Text;
  };

  type ApifyStats = {
    inputBodyLen : Nat;
    migrationCount : Nat;
    rebootCount : Nat;
    restartCount : Nat;
    resurrectCount : Nat;
    computeUnits : Nat;
  };

  type ApifyOptions = {
    build : Text;
    memoryMbytes : Nat;
    timeoutSecs : Nat;
    maxItems : Nat;
    diskMbytes : Nat;
  };

  type ApifyPricingInfo = {
    pricePerUnitUsd : Float;
    unitName : Text;
    pricingModel : Text;
    isPriceChangeNotificationSuppressed : Bool;
    startedAt : Text;
    createdAt : Text;
    apifyMarginPercentage : Float;
    notifiedAboutFutureChangeAt : Text;
    notifiedAboutChangeAt : Text;
  };

  // Dataset response types
  type ApifyDatasetResponse = {
    data : [ApifyDatasetItem];
  };

  type ApifyDatasetItem = {
    isFollowing : Bool;
  };

  // Transform function for HTTP requests
  public query func transform({
    context : Blob;
    response : IC.http_request_result;
  }) : async IC.http_request_result {
    ignore context;
    {
      response with headers = []; // not interested in headers for Twitter API
    };
  };

  // Cache TTL (24 hours in nanoseconds)
  private let CACHE_TTL : Nat = 86400 * 1_000_000_000;

  // External canister actor reference
  private func getUserDataActor() : async actor {
    getUser : (Principal, Text) -> async ?User;
  } {
    actor (USER_DATA_CANISTER_ID);
  };

  // Check if cached data is still valid
  private func isCacheValid(cached : CachedUser) : Bool {
    let now = Time.now();
    let age = now - cached.timestamp;
    age < cached.ttl;
  };

  // Fetch user data from external canister
  private func fetchUserData(principal : Principal, origin : Text) : async ?User {
    Debug.print("Fetching user data from external canister for principal: " # Principal.toText(principal));
    try {
      let userDataActor = await getUserDataActor();
      let result = await userDataActor.getUser(principal, origin);
      switch (result) {
        case (?user) {
          // Store in cache
          let cachedUser : CachedUser = {
            user = user;
            timestamp = Time.now();
            ttl = CACHE_TTL;
          };
          userDataStore := Trie.replace(
            userDataStore,
            { key = principal; hash = Principal.hash(principal) },
            Principal.equal,
            ?cachedUser,
          ).0;
          Debug.print("Stored user data in cache for principal: " # Principal.toText(principal));
          ?user;
        };
        case (null) {
          Debug.print("No user data found for principal: " # Principal.toText(principal));
          null;
        };
      };
    } catch (_error) {
      // Log error and return null
      Debug.print("Error fetching user data for principal: " # Principal.toText(principal));
      null;
    };
  };

  // Get user data (from cache or fetch from external canister)
  public shared (msg) func getUserData(origin : Text) : async ?User {
    let principal = msg.caller;

    Debug.print("Getting user data for principal: " # Principal.toText(principal));

    // Check cache first
    switch (Trie.find(userDataStore, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
      case (?cached) {
        if (isCacheValid(cached)) {
          Debug.print("Returning cached user data for principal: " # Principal.toText(principal));
          ?cached.user;
        } else {
          // Cache expired, fetch fresh data
          Debug.print("Cache expired, fetching fresh data for principal: " # Principal.toText(principal));
          await fetchUserData(principal, origin);
        };
      };
      case (null) {
        // No cached data, fetch from external canister
        Debug.print("No cached data, fetching from external canister for principal: " # Principal.toText(principal));
        await fetchUserData(principal, origin);
      };
    };
  };

  // Refresh user data (force fetch from external canister)
  public shared (msg) func refreshUserData(origin : Text) : async ?User {
    let principal = msg.caller;
    Debug.print("Refreshing user data for principal: " # Principal.toText(principal));
    await fetchUserData(principal, origin);
  };

  // Get cached user data without fetching (query call)
  public query (msg) func getCachedUserData() : async ?User {
    let principal = msg.caller;
    switch (Trie.find(userDataStore, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
      case (?cached) {
        if (isCacheValid(cached)) {
          ?cached.user;
        } else {
          null;
        };
      };
      case (null) { null };
    };
  };

  // Challenge CRUD operations

  // Create a new challenge
  public shared (msg) func createChallenge(description : Text, challengeType : ChallengeType) : async Nat {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeId = nextChallengeId;
    nextChallengeId += 1;

    let challenge : Challenge = {
      id = challengeId;
      description = description;
      challengeType = challengeType;
    };

    let newChallenge : Challenge = {
      id = challengeId;
      description = description;
      challengeType = challengeType;
    };
    challenges := Array.append(challenges, [newChallenge]);

    Debug.print("Created challenge: " # Nat.toText(challengeId) # " - " # description);

    challengeId;
  };

  // Get all challenges
  public query func getChallenges() : async [Challenge] {
    challenges;
  };

  // Get a specific challenge by ID
  public query func getChallenge(id : Nat) : async ?Challenge {
    Array.find<Challenge>(challenges, func(c) = c.id == id);
  };

  // Update a challenge
  public shared (msg) func updateChallenge(id : Nat, description : Text, challengeType : ChallengeType) : async Bool {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeIndex = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }) }, challenges, func(a, b) = a.id == b.id);
    switch (challengeIndex) {
      case (?index) {
        let updatedChallenge : Challenge = {
          id = id;
          description = description;
          challengeType = challengeType;
        };
        challenges := Array.tabulate<Challenge>(
          challenges.size(),
          func(i) {
            if (i == index) { updatedChallenge } else { challenges[i] };
          },
        );
        Debug.print("Updated challenge: " # Nat.toText(id));
        true;
      };
      case (null) {
        Debug.print("Challenge not found for update: " # Nat.toText(id));
        false;
      };
    };
  };

  // Delete a challenge
  public shared (msg) func deleteChallenge(id : Nat) : async Bool {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeIndex = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }) }, challenges, func(a, b) = a.id == b.id);
    switch (challengeIndex) {
      case (?index) {
        challenges := Array.tabulate<Challenge>(
          challenges.size() - 1,
          func(i) {
            challenges[if (i < index) { i } else { i + 1 }];
          },
        );
        Debug.print("Deleted challenge: " # Nat.toText(id));
        true;
      };
      case (null) {
        Debug.print("Challenge not found for deletion: " # Nat.toText(id));
        false;
      };
    };
  };

  // Get challenge status for current user
  public query (msg) func getChallengeStatus(challengeId : Nat) : async ?ChallengeStatus {
    let caller = msg.caller;
    switch (Trie.find(challengeStatuses, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?userStatuses) {
        Trie.find(userStatuses, { key = challengeId; hash = Hash.hash(challengeId) }, Nat.equal);
      };
      case (null) { null };
    };
  };

  // Set challenge status for current user (internal use)
  private func setChallengeStatus(caller : Principal, challengeId : Nat, status : ChallengeStatus) : () {
    let userStatuses = switch (Trie.find(challengeStatuses, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?statuses) { statuses };
      case (null) { Trie.empty() };
    };

    let updatedUserStatuses = Trie.replace(
      userStatuses,
      { key = challengeId; hash = Hash.hash(challengeId) },
      Nat.equal,
      ?status,
    ).0;

    challengeStatuses := Trie.replace(
      challengeStatuses,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      ?updatedUserStatuses,
    ).0;
  };

  // Set Apify Bearer Token (write-only, no getter for security)
  public shared (msg) func setApifyBearerToken(token : Text) : async () {
    let caller = msg.caller;
    // TODO: Add authorization check - only allow admin/owner to set this

    apifyBearerToken := token;
    Debug.print("Apify Bearer Token updated by principal: " # Principal.toText(caller));
  };

  // Set Apify Cookies
  public shared (msg) func setApifyCookies(cookies : Text) : async () {
    let caller = msg.caller;
    // TODO: Add authorization check - only allow admin/owner to set this

    apifyCookies := cookies;
    Debug.print("Apify Cookies updated by principal: " # Principal.toText(caller));
  };

  // Check if Apify Bearer Token is set
  public query func isApifyBearerTokenSet() : async Bool {
    Text.size(apifyBearerToken) > 0;
  };

  // Get masked Apify Bearer Token (last 5 characters)
  public query func getApifyBearerTokenMasked() : async ?Text {
    let tokenLength = Text.size(apifyBearerToken);
    if (tokenLength < 20) {
      null;
    } else {
      let text = Text.reverse(apifyBearerToken);
      let tokens = text.chars();
      let ?a = tokens.next() else return null;
      let ?b = tokens.next() else return null;
      let ?c = tokens.next() else return null;
      let ?d = tokens.next() else return null;
      let ?e = tokens.next() else return null;
      let hidden = "..." # Text.fromArray([e, d, c, b, a]);
      ?(hidden) // Simple masked representation
    };
  };

  // Verify challenge by checking Twitter following relationship
  public shared (msg) func verifyChallenge(challengeId : Nat) : async {
    #success : Bool;
    #error : Text;
  } {
    let caller = msg.caller;

    // Check if challenge is already verified
    switch (await getChallengeStatus(challengeId)) {
      case (?#verified) {
        return #error("Challenge already verified");
      };
      case (_) { /* Continue with verification */ };
    };

    // Find the challenge
    let challengeIndex = Array.indexOf<Challenge>({ id = challengeId; description = ""; challengeType = #follows({ user = "" }) }, challenges, func(a, b) = a.id == b.id);
    switch (challengeIndex) {
      case (?index) {
        let challenge = challenges[index];

        // Set status to pending
        setChallengeStatus(caller, challengeId, #pending);

        // Check if it's a follows challenge
        switch (challenge.challengeType) {
          case (#follows(targetUser)) {
            // Get user's Twitter data
            switch (Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
              case (?cachedUser) {
                if (isCacheValid(cachedUser)) {
                  // Check if user has Twitter data
                  switch (cachedUser.user.provider) {
                    case (#x) {
                      // User has Twitter/X account, proceed with verification
                      let result = await verifyTwitterFollowing(caller, cachedUser.user.username, targetUser.user);
                      switch (result) {
                        case (#success(isFollowing)) {
                          if (isFollowing) {
                            setChallengeStatus(caller, challengeId, #verified);
                            #success(true);
                          } else {
                            setChallengeStatus(caller, challengeId, #failed("Not following the required user"));
                            #success(false);
                          };
                        };
                        case (#error(err)) {
                          setChallengeStatus(caller, challengeId, #failed(err));
                          #error(err);
                        };
                      };
                    };
                    case (_) {
                      setChallengeStatus(caller, challengeId, #failed("User does not have a Twitter/X account linked"));
                      #error("User does not have a Twitter/X account linked");
                    };
                  };
                } else {
                  setChallengeStatus(caller, challengeId, #failed("User data is stale, please refresh your profile"));
                  #error("User data is stale, please refresh your profile");
                };
              };
              case (null) {
                setChallengeStatus(caller, challengeId, #failed("No user data found, please sign in with Twitter/X"));
                #error("No user data found, please sign in with Twitter/X");
              };
            };
          };
          case (_) {
            setChallengeStatus(caller, challengeId, #failed("Unsupported challenge type"));
            #error("Unsupported challenge type");
          };
        };
      };
      case (null) {
        #error("Challenge not found");
      };
    };
  };

  // Helper function to verify Twitter following relationship using Apify
  private func verifyTwitterFollowing(caller : Principal, sourceUsername : ?Text, targetUsername : Text) : async {
    #success : Bool;
    #error : Text;
  } {
    // Check if source username is available
    let ?sourceUser = sourceUsername else {
      return #error("Source user username not available");
    };

    // Check if Apify token and cookies are set
    if (Text.size(apifyBearerToken) == 0) {
      return #error("Apify API token not configured");
    };
    if (Text.size(apifyCookies) == 0) {
      return #error("Apify cookies not configured");
    };

    Debug.print("Verifying Twitter following: " # sourceUser # " -> " # targetUsername);

    // 1. SETUP ARGUMENTS FOR HTTP POST request to Apify
    let url = "https://api.apify.com/v2/acts/UC0t7r32caYf7tYgZ/runs?token=" # apifyBearerToken;
    let bodyText = "{"
    # "\"user_a\": \"" # sourceUser # "\","
    # "\"user_b\": \"" # targetUsername # "\","
    # "\"cookies\": " # "\"" # apifyCookies # "\""
    # "}";

    // 1.1 Prepare headers for the Apify request
    let request_headers = [
      { name = "Content-Type"; value = "application/json" },
    ];

    // 1.2 The HTTP request
    let http_request : IC.http_request_args = {
      url = url;
      max_response_bytes = ?(1024 * 1024); // 1MB max response
      headers = request_headers;
      body = ?Text.encodeUtf8(bodyText);
      method = #post;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = ?false;
    };

    // 2. MAKE HTTPS REQUEST AND WAIT FOR RESPONSE
    let http_response : IC.http_request_result = await (with cycles = 200_000_000_000) IC.http_request(http_request);

    // 3. PROCESS THE RESPONSE
    let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
      case (null) { return #error("Failed to decode response body") };
      case (?y) { y };
    };

    Debug.print("Apify API response status: " # Nat.toText(http_response.status));
    Debug.print("Apify API response: " # decoded_text);

    // 4. CHECK HTTP STATUS CODE
    if (http_response.status != 201) {
      switch (http_response.status) {
        case (401) {
          return #error("Apify API authentication failed - check bearer token");
        };
        case (403) { return #error("Apify API access forbidden") };
        case (404) { return #error("Apify actor not found") };
        case (429) { return #error("Apify API rate limit exceeded") };
        case (_) {
          return #error("Apify API error: HTTP " # Nat.toText(http_response.status));
        };
      };
    };

    // 5. PARSE JSON RESPONSE TO GET DATASET ID
    switch (Json.parse(decoded_text)) {
      case (#ok(json)) {
        // Extract dataset ID from response
        switch (Json.get(json, "data")) {
          case (?dataJson) {
            switch (Json.get(dataJson, "defaultDatasetId")) {
              case (?#string(datasetId)) {
                // Now query the dataset results
                let result = await getApifyDatasetResults(datasetId);
                switch (result) {
                  case (#success(isFollowing)) {
                    Debug.print("Verification result: " # sourceUser # " following " # targetUsername # " = " # (if (isFollowing) "true" else "false"));
                    #success(isFollowing);
                  };
                  case (#error(err)) {
                    #error(err);
                  };
                };
              };
              case (_) {
                #error("Failed to extract dataset ID from Apify response");
              };
            };
          };
          case (_) {
            #error("No data field in Apify response");
          };
        };
      };
      case (#err(error)) {
        Debug.print("JSON parsing error: " # debug_show(error));
        #error("Failed to parse Apify API response");
      };
    };
  };

  // Helper function to get Apify dataset results
  private func getApifyDatasetResults(datasetId : Text) : async {
    #success : Bool;
    #error : Text;
  } {
    let url = "https://api.apify.com/v2/datasets/" # datasetId # "/items?token=" # apifyBearerToken;

    let request_headers = [
      { name = "Content-Type"; value = "application/json" },
    ];

    let http_request : IC.http_request_args = {
      url = url;
      max_response_bytes = ?(1024 * 1024);
      headers = request_headers;
      body = null;
      method = #get;
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
      is_replicated = ?false;
    };

    let http_response : IC.http_request_result = await (with cycles = 100_000_000_000) IC.http_request(http_request);

    let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
      case (null) { return #error("Failed to decode dataset response") };
      case (?y) { y };
    };

    if (http_response.status != 200) {
      return #error("Failed to get dataset results: HTTP " # Nat.toText(http_response.status));
    };

    // Parse the dataset results
    switch (Json.parse(decoded_text)) {
      case (#ok(json)) {
        // The response should be an array of items directly
        switch (json) {
          case (#array(items)) {
            if (items.size() > 0) {
              switch (Json.get(items[0], "isFollowing")) {
                case (?#bool(isFollowing)) {
                  #success(isFollowing);
                };
                case (_) {
                  #error("isFollowing field not found in dataset item");
                };
              };
            } else {
              #error("No items in dataset results");
            };
          };
          case (_) {
            #error("Dataset response is not an array");
          };
        };
      };
      case (#err(_)) {
        #error("Failed to parse dataset JSON");
      };
    };
  };

  // Store followers data from Twitter API response
  private func storeFollowersData(targetUserId : Text, json : Json.Json) : () {
    // Extract followers from the JSON response
    // Twitter API response format: {"data": [{"id": "123", "username": "user"}, ...], ...}
    switch (Json.get(json, "data")) {
      case (?followersJson) {
        switch (followersJson) {
          case (#array(followers)) {
            // Extract follower IDs
            var followerIds : [Text] = [];
            for (follower in followers.vals()) {
              switch (Json.get(follower, "id")) {
                case (?#string(id)) {
                  followerIds := Array.append(followerIds, [id]);
                };
                case (_) { /* Skip invalid entries */ };
              };
            };

            // Store in cache (simple array approach)
            // Remove existing entry if it exists
            followersCache := Array.filter<(Text, [Text])>(followersCache, func((userId, _)) { userId != targetUserId });
            // Add new entry
            followersCache := Array.append(followersCache, [(targetUserId, followerIds)]);

            Debug.print("Stored " # Nat.toText(followerIds.size()) # " followers for user " # targetUserId);
          };
          case (_) {
            Debug.print("No followers data found in response");
          };
        };
      };
      case (null) {
        Debug.print("No data field in Twitter API response");
      };
    };
  };

  // Check if a user follows another user using cached data
  private func checkIfUserFollows(sourceUserId : Text, targetUserId : Text) : Bool {
    // Find the target user in the cache
    for ((userId, followerIds) in followersCache.vals()) {
      if (userId == targetUserId) {
        // Check if sourceUserId is in the followers list
        for (followerId in followerIds.vals()) {
          if (followerId == sourceUserId) {
            return true;
          };
        };
        return false;
      };
    };
    Debug.print("No cached followers data for user " # targetUserId);
    false;
  };

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
