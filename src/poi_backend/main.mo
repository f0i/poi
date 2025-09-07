import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Hash "mo:base/Hash";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Nat64 "mo:base/Nat64";
import IC "ic:aaaaa-aa";

persistent actor {
  // External canister types
  type Provider = { #github; #twitter; #discord; #google; #auth0; #zitadel; #x };
  type User = {
    id: Text;
    bio: ?Text;
    verified: ?Bool;
    username: ?Text;
    provider: Provider;
    provider_created_at: ?Text;
    avatar_url: ?Text;
    name: ?Text;
    createdAt: Time.Time;
    origin: Text;
    following_count: ?Nat;
    public_gists: ?Nat;
    email: ?Text;
    website: ?Text;
    tweet_count: ?Nat;
    public_repos: ?Nat;
    email_verified: ?Bool;
    followers_count: ?Nat;
    location: ?Text;
  };

  // Cached user data with timestamp
  type CachedUser = {
    user: User;
    timestamp: Time.Time;
    ttl: Nat; // Time to live in seconds (24 hours = 86400)
  };

  // Challenge types
  type ChallengeType = {
    #follows: { user: Text };
  };

  type Challenge = {
    id: Nat;
    description: Text;
    challengeType: ChallengeType;
  };

  // Storage for cached user data
  private stable var userDataStore: Trie.Trie<Principal, CachedUser> = Trie.empty();

  // Storage for challenges
  private stable var challenges: [Challenge] = [];

  // Challenge ID counter
  private var nextChallengeId: Nat = 0;

  // External canister ID
  private let USER_DATA_CANISTER_ID = "fhzgg-waaaa-aaaah-aqzvq-cai";

  // Twitter API Bearer Token (write-only, no getter)
  private stable var twitterBearerToken: Text = "";

  // Challenge status storage: Principal -> ChallengeId -> Status
  private stable var challengeStatuses: Trie.Trie<Principal, Trie.Trie<Nat, {
    #pending;
    #verified;
    #failed: Text;
  }>> = Trie.empty();

  // Challenge status type for external use
  public type ChallengeStatus = {
    #pending;
    #verified;
    #failed: Text;
  };

  // Transform function for HTTP requests
  public query func transform({
    context : Blob;
    response : IC.http_request_result;
  }) : async IC.http_request_result {
    {
      response with headers = []; // not interested in headers for Twitter API
    };
  };

  // Cache TTL (24 hours in nanoseconds)
  private let CACHE_TTL: Nat = 86400 * 1_000_000_000;

  // External canister actor reference
  private func getUserDataActor() : async actor {
    getUser: (Principal, Text) -> async ?User;
  } {
    actor(USER_DATA_CANISTER_ID)
  };

  // Check if cached data is still valid
  private func isCacheValid(cached: CachedUser) : Bool {
    let now = Time.now();
    let age = now - cached.timestamp;
    age < cached.ttl
  };

  // Fetch user data from external canister
  private func fetchUserData(principal: Principal, origin: Text) : async ?User {
    Debug.print("Fetching user data from external canister for principal: " # Principal.toText(principal));
    try {
      let userDataActor = await getUserDataActor();
      let result = await userDataActor.getUser(principal, origin);
      switch (result) {
        case (?user) {
          // Store in cache
          let cachedUser: CachedUser = {
            user = user;
            timestamp = Time.now();
            ttl = CACHE_TTL;
          };
          userDataStore := Trie.replace(
            userDataStore,
            { key = principal; hash = Principal.hash(principal) },
            Principal.equal,
            ?cachedUser
          ).0;
          Debug.print("Stored user data in cache for principal: " # Principal.toText(principal));
          ?user
        };
        case (null) {
          Debug.print("No user data found for principal: " # Principal.toText(principal));
          null
        };
      }
    } catch (_error) {
      // Log error and return null
      Debug.print("Error fetching user data for principal: " # Principal.toText(principal));
      null
    };
  };

  // Get user data (from cache or fetch from external canister)
  public shared(msg) func getUserData(origin: Text) : async ?User {
    let principal = msg.caller;

    Debug.print("Getting user data for principal: " # Principal.toText(principal));

    // Check cache first
    switch (Trie.find(userDataStore, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
      case (?cached) {
        if (isCacheValid(cached)) {
          Debug.print("Returning cached user data for principal: " # Principal.toText(principal));
          ?cached.user
        } else {
          // Cache expired, fetch fresh data
          Debug.print("Cache expired, fetching fresh data for principal: " # Principal.toText(principal));
          await fetchUserData(principal, origin)
        }
      };
      case (null) {
        // No cached data, fetch from external canister
        Debug.print("No cached data, fetching from external canister for principal: " # Principal.toText(principal));
        await fetchUserData(principal, origin)
      };
    }
  };

  // Refresh user data (force fetch from external canister)
  public shared(msg) func refreshUserData(origin: Text) : async ?User {
    let principal = msg.caller;
    Debug.print("Refreshing user data for principal: " # Principal.toText(principal));
    await fetchUserData(principal, origin)
  };

  // Get cached user data without fetching (query call)
  public query(msg) func getCachedUserData() : async ?User {
    let principal = msg.caller;
    switch (Trie.find(userDataStore, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
      case (?cached) {
        if (isCacheValid(cached)) {
          ?cached.user
        } else {
          null
        }
      };
      case (null) { null };
    }
  };

  // Challenge CRUD operations

  // Create a new challenge
  public shared(msg) func createChallenge(description: Text, challengeType: ChallengeType) : async Nat {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeId = nextChallengeId;
    nextChallengeId += 1;

    let challenge: Challenge = {
      id = challengeId;
      description = description;
      challengeType = challengeType;
    };

    let newChallenge: Challenge = {
      id = challengeId;
      description = description;
      challengeType = challengeType;
    };
    challenges := Array.append(challenges, [newChallenge]);

    Debug.print("Created challenge: " # Nat.toText(challengeId) # " - " # description);

    challengeId
  };

  // Get all challenges
  public query func getChallenges() : async [Challenge] {
    challenges
  };

  // Get a specific challenge by ID
  public query func getChallenge(id: Nat) : async ?Challenge {
    Array.find<Challenge>(challenges, func (c) = c.id == id)
  };

  // Update a challenge
  public shared(msg) func updateChallenge(id: Nat, description: Text, challengeType: ChallengeType) : async Bool {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeIndex = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }) }, challenges, func (a, b) = a.id == b.id);
    switch (challengeIndex) {
      case (?index) {
        let updatedChallenge: Challenge = {
          id = id;
          description = description;
          challengeType = challengeType;
        };
        challenges := Array.tabulate<Challenge>(challenges.size(), func (i) {
          if (i == index) { updatedChallenge } else { challenges[i] }
        });
        Debug.print("Updated challenge: " # Nat.toText(id));
        true
      };
      case (null) {
        Debug.print("Challenge not found for update: " # Nat.toText(id));
        false
      };
    }
  };

  // Delete a challenge
  public shared(msg) func deleteChallenge(id: Nat) : async Bool {
    let caller = msg.caller;
    // TODO: Add authorization check if needed

    let challengeIndex = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }) }, challenges, func (a, b) = a.id == b.id);
    switch (challengeIndex) {
      case (?index) {
        challenges := Array.tabulate<Challenge>(challenges.size() - 1, func (i) {
          challenges[if (i < index) { i } else { i + 1 }]
        });
        Debug.print("Deleted challenge: " # Nat.toText(id));
        true
      };
      case (null) {
        Debug.print("Challenge not found for deletion: " # Nat.toText(id));
        false
      };
    }
  };

  // Get challenge status for current user
  public query(msg) func getChallengeStatus(challengeId: Nat) : async ?ChallengeStatus {
    let caller = msg.caller;
    switch (Trie.find(challengeStatuses, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?userStatuses) {
        Trie.find(userStatuses, { key = challengeId; hash = Hash.hash(challengeId) }, Nat.equal)
      };
      case (null) { null };
    }
  };

  // Set challenge status for current user (internal use)
  private func setChallengeStatus(caller: Principal, challengeId: Nat, status: ChallengeStatus) : () {
    let userStatuses = switch (Trie.find(challengeStatuses, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?statuses) { statuses };
      case (null) { Trie.empty() };
    };

    let updatedUserStatuses = Trie.replace(
      userStatuses,
      { key = challengeId; hash = Hash.hash(challengeId) },
      Nat.equal,
      ?status
    ).0;

    challengeStatuses := Trie.replace(
      challengeStatuses,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      ?updatedUserStatuses
    ).0;
  };

  // Set Twitter Bearer Token (write-only, no getter for security)
  public shared(msg) func setTwitterBearerToken(token: Text) : async () {
    let caller = msg.caller;
    // TODO: Add authorization check - only allow admin/owner to set this

    twitterBearerToken := token;
    Debug.print("Twitter Bearer Token updated by principal: " # Principal.toText(caller));
  };

  // Verify challenge by checking Twitter following relationship
  public shared(msg) func verifyChallenge(challengeId: Nat) : async {
    #success: Bool;
    #error: Text;
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
    let challengeIndex = Array.indexOf<Challenge>({ id = challengeId; description = ""; challengeType = #follows({ user = "" }) }, challenges, func (a, b) = a.id == b.id);
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
                      let result = await verifyTwitterFollowing(caller, cachedUser.user.id, targetUser.user);
                      switch (result) {
                        case (#success(isFollowing)) {
                          if (isFollowing) {
                            setChallengeStatus(caller, challengeId, #verified);
                            #success(true)
                          } else {
                            setChallengeStatus(caller, challengeId, #failed("Not following the required user"));
                            #success(false)
                          }
                        };
                        case (#error(err)) {
                          setChallengeStatus(caller, challengeId, #failed(err));
                          #error(err)
                        };
                      }
                    };
                    case (_) {
                      setChallengeStatus(caller, challengeId, #failed("User does not have a Twitter/X account linked"));
                      #error("User does not have a Twitter/X account linked")
                    };
                  }
                } else {
                  setChallengeStatus(caller, challengeId, #failed("User data is stale, please refresh your profile"));
                  #error("User data is stale, please refresh your profile")
                }
              };
              case (null) {
                setChallengeStatus(caller, challengeId, #failed("No user data found, please sign in with Twitter/X"));
                #error("No user data found, please sign in with Twitter/X")
              };
            }
          };
          case (_) {
            setChallengeStatus(caller, challengeId, #failed("Unsupported challenge type"));
            #error("Unsupported challenge type")
          };
        }
      };
      case (null) {
        #error("Challenge not found")
      };
    }
  };

  // Helper function to verify Twitter following relationship
  private func verifyTwitterFollowing(caller: Principal, sourceUserId: Text, targetUsername: Text) : async {
    #success: Bool;
    #error: Text;
  } {
    // Check if Bearer token is set
    if (Text.size(twitterBearerToken) == 0) {
      return #error("Twitter API token not configured");
    };

    Debug.print("Verifying Twitter following: " # sourceUserId # " -> " # targetUsername);

    // 1. SETUP ARGUMENTS FOR HTTP GET request to Twitter API v2
    let host : Text = "api.twitter.com";
    let url = "https://" # host # "/2/users/" # sourceUserId # "/following?user.fields=id,username&max_results=1000";

    // 1.1 Prepare headers for the Twitter API request
    let request_headers = [
      { name = "Authorization"; value = "Bearer " # twitterBearerToken; },
      { name = "User-Agent"; value = "poi-verification/1.0" },
    ];

    // 1.2 The HTTP request
    let http_request : IC.http_request_args = {
      url = url;
      max_response_bytes = ?(1024 * 1024); // 1MB max response
      headers = request_headers;
      body = null; // GET request, no body
      method = #get;
      is_replicated = ?false; // Not replicated for query-like calls
      transform = ?{
        function = transform;
        context = Blob.fromArray([]);
      };
    };

    // 2. ADD CYCLES TO PAY FOR HTTP REQUEST
    // Twitter API calls typically need around 100-200 billion cycles
    Cycles.add(200_000_000_000);

    // 3. MAKE HTTPS REQUEST AND WAIT FOR RESPONSE
    let http_response : IC.http_request_result = await IC.http_request(http_request);

    // 4. PROCESS THE RESPONSE
    let decoded_text : Text = switch (Text.decodeUtf8(http_response.body)) {
      case (null) { return #error("Failed to decode response body"); };
      case (?y) { y };
    };

    Debug.print("Twitter API response status: " # Nat.toText(http_response.status));
    Debug.print("Twitter API response: " # decoded_text);

    // 5. CHECK HTTP STATUS CODE
    if (http_response.status != 200) {
      switch (http_response.status) {
        case (401) { return #error("Twitter API authentication failed - check bearer token"); };
        case (403) { return #error("Twitter API access forbidden"); };
        case (404) { return #error("Twitter user not found"); };
        case (429) { return #error("Twitter API rate limit exceeded"); };
        case (_) { return #error("Twitter API error: HTTP " # Nat.toText(http_response.status)); };
      };
    };

    // 6. PARSE RESPONSE TO CHECK IF TARGET USER IS FOLLOWED
    // Twitter API v2 response format:
    // {"data": [{"id": "123", "username": "targetuser"}, ...], "meta": {...}}
    let isFollowing = checkIfUserIsFollowed(decoded_text, targetUsername);

    Debug.print("Verification result: " # sourceUserId # " following " # targetUsername # " = " # (if (isFollowing) "true" else "false"));

    #success(isFollowing)
  };

  // Helper function to parse Twitter API response and check if target user is followed
  private func checkIfUserIsFollowed(responseJson: Text, targetUsername: Text) : Bool {
    // Simple string-based parsing for the username in the response
    // In a production system, you might want to use a proper JSON parser
    let searchPattern = "\"username\":\"" # targetUsername # "\"";
    Text.contains(responseJson, #text searchPattern)
  };



  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
