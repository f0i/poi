import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
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
    points : Nat; // Points awarded for completing this challenge
  };

  // Storage for cached user data
  private var userDataStore : Trie.Trie<Principal, CachedUser> = Trie.empty();

  // Storage for challenges
  private var challenges : [Challenge] = [];

  // Challenge ID counter
  private var nextChallengeId : Nat = 0;

  // External canister ID
  private let USER_DATA_CANISTER_ID = "fhzgg-waaaa-aaaah-aqzvq-cai";

  // Cache TTL in seconds (24 hours)
  private let CACHE_TTL : Nat = 86400;

  // Rate limiting constants
  private let BASE_VERIFICATION_COOLDOWN : Nat = 300_000_000_000; // 5 minutes base cooldown in nanoseconds
  private let MAX_CONSECUTIVE_FAILURES : Nat = 5; // Max consecutive failures before severe lockout
  private let PERMANENT_BLOCK_THRESHOLD : Nat = 5; // Permanent block after this many consecutive failures

  // Apify API Bearer Token (write-only, no getter)
  private var apifyBearerToken : Text = "";

  // Apify cookies string
  private var apifyCookies : Text = "";

  // Challenge status storage: Principal -> ChallengeId -> Status
  private var challengeStatuses : Trie.Trie<Principal, Trie.Trie<Nat, { #pending; #verified; #failed : Text }>> = Trie.empty();

  // Rate limiting storage
  // Verification attempts: Principal -> ChallengeId -> { attempts: Nat, lastAttempt: Time.Time }
  private var verificationAttempts : Trie.Trie<Principal, Trie.Trie<Nat, { attempts : Nat; lastAttempt : Time.Time }>> = Trie.empty();

  // Consecutive failed attempts: Principal -> { count: Nat, lastFailure: Time.Time }
  private var consecutiveFailures : Trie.Trie<Principal, { count : Nat; lastFailure : Time.Time }> = Trie.empty();

  // Ongoing verifications: Principal -> ChallengeId (to prevent concurrent verifications)
  private var ongoingVerifications : Trie.Trie<Principal, Nat> = Trie.empty();

  // Failed verification lockouts: Principal -> { lockedUntil: Time.Time, reason: Text, failureCount: Nat }
  private var verificationLockouts : Trie.Trie<Principal, { lockedUntil : Time.Time; reason : Text; failureCount : Nat }> = Trie.empty();

  // Permanent blocks: Principal -> { blockedAt: Time.Time, reason: Text, totalFailures: Nat }
  private var permanentBlocks : Trie.Trie<Principal, { blockedAt : Time.Time; reason : Text; totalFailures : Nat }> = Trie.empty();

  // Followers storage: TargetUserId -> Array of FollowerIds
  private var followersCache : [(Text, [Text])] = [];

  // Admin principal (set only once)
  private var admin : ?Principal = null;

  // User points tracking: Principal -> { challengePoints, followerPoints, totalPoints, lastUpdated }
  private var userPoints : Trie.Trie<Principal, { challengePoints : Nat; followerPoints : Nat; totalPoints : Nat; lastUpdated : Time.Time }> = Trie.empty();

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

  // Get user data actor reference
  private func getUserDataActor() : async* actor {
    getUser : (Principal, Text) -> async ?User;
  } {
    let canisterId = Principal.fromText(USER_DATA_CANISTER_ID);
    actor (Principal.toText(canisterId)) : actor {
      getUser : (Principal, Text) -> async ?User;
    };
  };

  // Check if cached user data is still valid
  private func isCacheValid(cached : CachedUser) : Bool {
    let now = Time.now();
    let age = now - cached.timestamp;
    age < (cached.ttl * 1_000_000_000); // Convert seconds to nanoseconds
  };

  // Fetch user data from external canister
  private func fetchUserData(principal : Principal, origin : Text) : async ?User {
    Debug.print("Fetching user data from external canister for principal: " # Principal.toText(principal));
    try {
      let userDataActor = await* getUserDataActor();
      let userOpt = await userDataActor.getUser(principal, origin);
      switch (userOpt) {
        case (?user) {
          // Debug log user data fields
          Debug.print("User data received - username: " # (switch (user.username) { case (?u) u; case (null) "null" }));
          Debug.print("User data received - followers_count: " # (switch (user.followers_count) { case (?fc) Nat.toText(fc); case (null) "null" }));
          Debug.print("User data received - following_count: " # (switch (user.following_count) { case (?fc) Nat.toText(fc); case (null) "null" }));

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
          return ?user;
        };
        case (null) {
          Debug.print("No user data found for principal: " # Principal.toText(principal));
          return null;
        };
      };
    } catch (_error) {
      // Log error and return null
      Debug.print("Error fetching user data for principal: " # Principal.toText(principal));
      return null;
    };
  };

  // Get user data (from cache or fetch from external canister)
  public shared ({ caller }) func getUserData(origin : Text) : async ?User {
    Debug.print("Getting user data for principal: " # Principal.toText(caller));

    // Check cache first
    let cachedOpt = Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal);
    switch (cachedOpt) {
      case (?cached) {
        if (isCacheValid(cached)) {
          Debug.print("Returning cached user data for principal: " # Principal.toText(caller));
          return ?cached.user;
        };
      };
      case (null) {};
    };

    // Cache expired or no cached data, fetch from external canister
    Debug.print("Fetching fresh data for principal: " # Principal.toText(caller));
    return await fetchUserData(caller, origin);
  };

  // Refresh user data (force fetch from external canister)
  public shared ({ caller }) func refreshUserData(origin : Text) : async ?User {
    Debug.print("Refreshing user data for principal: " # Principal.toText(caller));
    return await fetchUserData(caller, origin);
  };

  // Force refresh user data and recalculate points
  public shared ({ caller }) func refreshUserPoints(origin : Text) : async {
    challengePoints : Nat;
    followerPoints : Nat;
    totalPoints : Nat;
  } {
    Debug.print("Refreshing user points for principal: " # Principal.toText(caller));

    // Force refresh user data
    let _userData = await fetchUserData(caller, origin);

    // Recalculate points
    let currentPoints = switch (Trie.find(userPoints, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?points) { points };
      case (null) {
        {
          challengePoints = 0;
          followerPoints = 0;
          totalPoints = 0;
          lastUpdated = Time.now();
        };
      };
    };

    // Recalculate follower points with fresh data
    let followerPoints = switch (Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?cachedUser) {
        if (isCacheValid(cachedUser)) {
          Debug.print("Recalculating follower points with fresh data");
          switch (cachedUser.user.followers_count) {
            case (?count) {
              Debug.print("Fresh follower count found: " # Nat.toText(count));
              calculateFollowerPoints(count);
            };
            case (null) {
              Debug.print("No fresh follower count available");
              0;
            };
          };
        } else {
          Debug.print("Fresh cached data is invalid");
          0;
        };
      };
      case (null) {
        Debug.print("No fresh cached user data found");
        0;
      };
    };

    let newTotalPoints = currentPoints.challengePoints + followerPoints;

    // Update user points
    let updatedPoints = {
      challengePoints = currentPoints.challengePoints;
      followerPoints = followerPoints;
      totalPoints = newTotalPoints;
      lastUpdated = Time.now();
    };

    userPoints := Trie.replace(
      userPoints,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      ?updatedPoints,
    ).0;

    Debug.print("Refreshed user points - Challenge: " # Nat.toText(currentPoints.challengePoints) # ", Follower: " # Nat.toText(followerPoints) # ", Total: " # Nat.toText(newTotalPoints));

    return {
      challengePoints = currentPoints.challengePoints;
      followerPoints = followerPoints;
      totalPoints = newTotalPoints;
    };
  };

  // Get cached user data without fetching (query call)
  public query ({ caller }) func getCachedUserData() : async ?User {
    let cachedOpt = Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal);
    switch (cachedOpt) {
      case (?cached) {
        if (isCacheValid(cached)) {
          return ?cached.user;
        } else {
          return null;
        };
      };
      case (null) { return null };
    };
  };

  // Challenge CRUD operations

  // Create a new challenge
  public shared ({ caller }) func createChallenge(description : Text, challengeType : ChallengeType, points : Nat) : async Nat {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can create challenges");
    };

    let challengeId = nextChallengeId;
    nextChallengeId += 1;

    let newChallenge : Challenge = {
      id = challengeId;
      description = description;
      challengeType = challengeType;
      points = points;
    };
    challenges := Array.append(challenges, [newChallenge]);

    Debug.print("Challenge created by admin: " # Nat.toText(challengeId) # " - " # description # " (" # Nat.toText(points) # " points)");

    return challengeId;
  };

  // Get all challenges
  public query func getChallenges() : async [Challenge] {
    return challenges;
  };

  // Get a specific challenge by ID
  public query func getChallenge(id : Nat) : async ?Challenge {
    return Array.find<Challenge>(challenges, func(c) = c.id == id);
  };

  // Update a challenge
  public shared ({ caller }) func updateChallenge(id : Nat, description : Text, challengeType : ChallengeType, points : Nat) : async Bool {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can update challenges");
    };

    let ?index = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }); points = 0 }, challenges, func(a, b) = a.id == b.id) else {
      Debug.print("Challenge not found for update: " # Nat.toText(id));
      return false;
    };

    let updatedChallenge : Challenge = {
      id = id;
      description = description;
      challengeType = challengeType;
      points = points;
    };
    challenges := Array.tabulate<Challenge>(
      challenges.size(),
      func(i) {
        if (i == index) { updatedChallenge } else { challenges[i] };
      },
    );
    Debug.print("Challenge updated by admin: " # Nat.toText(id));
    return true;
  };

  // Delete a challenge
  public shared ({ caller }) func deleteChallenge(id : Nat) : async Bool {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can delete challenges");
    };

    let ?index = Array.indexOf<Challenge>({ id = id; description = ""; challengeType = #follows({ user = "" }); points = 0 }, challenges, func(a, b) = a.id == b.id) else {
      Debug.print("Challenge not found for deletion: " # Nat.toText(id));
      return false;
    };

    challenges := Array.tabulate<Challenge>(
      challenges.size() - 1,
      func(i) {
        challenges[if (i < index) { i } else { i + 1 }];
      },
    );
    Debug.print("Challenge deleted by admin: " # Nat.toText(id));
    return true;
  };

  // Get challenge status for current user
  public query ({ caller }) func getChallengeStatus(challengeId : Nat) : async ?ChallengeStatus {
    let userStatusesOpt = Trie.find(challengeStatuses, { key = caller; hash = Principal.hash(caller) }, Principal.equal);
    switch (userStatusesOpt) {
      case (?userStatuses) {
        return Trie.find(userStatuses, { key = challengeId; hash = Hash.hash(challengeId) }, Nat.equal);
      };
      case (null) { return null };
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
  public shared ({ caller }) func setApifyBearerToken(token : Text) : async () {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can set Apify Bearer Token");
    };

    apifyBearerToken := token;
    Debug.print("Apify Bearer Token updated by admin: " # Principal.toText(caller));
  };

  // Set Apify Cookies
  public shared ({ caller }) func setApifyCookies(cookies : Text) : async () {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can set Apify Cookies");
    };

    apifyCookies := cookies;
    Debug.print("Apify Cookies updated by admin: " # Principal.toText(caller));
  };

  // Set admin (can only be called once, by a non-anonymous principal)
  public shared ({ caller }) func setAdmin() : async () {
    // Check if caller is anonymous
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous principals cannot be set as admin");
    };

    // Check if admin is already set
    switch (admin) {
      case (?_) {
        Debug.trap("Admin is already set and cannot be changed");
      };
      case (null) {
        // Set the admin to the caller
        admin := ?caller;
        Debug.print("Admin set to principal: " # Principal.toText(caller));
      };
    };
  };

  // Get current admin
  public query func getAdmin() : async ?Principal {
    return admin;
  };

  // Admin function to recalculate points for all users
  public shared ({ caller }) func recalculateAllUserPoints() : async {
    usersProcessed : Nat;
    totalPointsUpdated : Nat;
  } {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can recalculate points");
    };

    var usersProcessed : Nat = 0;
    var totalPointsUpdated : Nat = 0;

    // Iterate through all users with stored points
    for ((user, _) in Trie.iter(userPoints)) {
      let calculatedPoints = calculateUserPoints(user);

      // Update stored points
      let updatedPoints = {
        challengePoints = calculatedPoints.challengePoints;
        followerPoints = calculatedPoints.followerPoints;
        totalPoints = calculatedPoints.totalPoints;
        lastUpdated = Time.now();
      };

      userPoints := Trie.replace(
        userPoints,
        { key = user; hash = Principal.hash(user) },
        Principal.equal,
        ?updatedPoints,
      ).0;

      usersProcessed += 1;
      totalPointsUpdated += calculatedPoints.totalPoints;
    };

    Debug.print("Recalculated points for " # Nat.toText(usersProcessed) # " users, total points: " # Nat.toText(totalPointsUpdated));

    return {
      usersProcessed = usersProcessed;
      totalPointsUpdated = totalPointsUpdated;
    };
  };

  // Check if caller is admin
  private func isCallerAdmin(caller : Principal) : Bool {
    switch (admin) {
      case (?adminPrincipal) {
        return Principal.equal(caller, adminPrincipal);
      };
      case (null) {
        return false;
      };
    };
  };

  // Calculate follower points using the specified algorithm
  private func calculateFollowerPoints(followers : Nat) : Nat {
    var points : Nat = 0;
    var score : Nat = followers;
    while (score > 100) {
      points += 10;
      score := score / 10;
    };
    points += score / 10;
    return points;
  };

  // Update user points after challenge completion
  private func awardChallengePoints(caller : Principal, challengeId : Nat) : () {
    // Find the challenge to get its points value
    let ?index = Array.indexOf<Challenge>({ id = challengeId; description = ""; challengeType = #follows({ user = "" }); points = 0 }, challenges, func(a, b) = a.id == b.id) else {
      Debug.print("Challenge not found for points award: " # Nat.toText(challengeId));
      return;
    };

    let challenge = challenges[index];
    let challengePointsAwarded = challenge.points;

    // Get current user points or initialize
    let currentPoints = switch (Trie.find(userPoints, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?points) { points };
      case (null) {
        {
          challengePoints = 0;
          followerPoints = 0;
          totalPoints = 0;
          lastUpdated = Time.now();
        };
      };
    };

    // Update challenge points
    let newChallengePoints = currentPoints.challengePoints + challengePointsAwarded;

    // Calculate follower points (need user data)
    let followerPoints = switch (Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?cachedUser) {
        if (isCacheValid(cachedUser)) {
          Debug.print("Found cached user data for follower calculation");
          switch (cachedUser.user.followers_count) {
            case (?count) {
              Debug.print("Follower count found: " # Nat.toText(count));
              calculateFollowerPoints(count);
            };
            case (null) {
              Debug.print("No follower count in user data");
              0;
            };
          };
        } else {
          Debug.print("Cached user data is stale, cannot calculate follower points");
          0;
        };
      };
      case (null) {
        Debug.print("No cached user data found for follower calculation");
        0;
      };
    };

    let newTotalPoints = newChallengePoints + followerPoints;

    // Update user points
    let updatedPoints = {
      challengePoints = newChallengePoints;
      followerPoints = followerPoints;
      totalPoints = newTotalPoints;
      lastUpdated = Time.now();
    };

    userPoints := Trie.replace(
      userPoints,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      ?updatedPoints,
    ).0;

    Debug.print("Awarded " # Nat.toText(challengePointsAwarded) # " points to user for challenge " # Nat.toText(challengeId) # ". Total: " # Nat.toText(newTotalPoints));
  };

  // Calculate user points dynamically by checking challenge completion
  private func calculateUserPoints(user : Principal) : {
    challengePoints : Nat;
    followerPoints : Nat;
    totalPoints : Nat;
  } {
    Debug.print("🔍 BACKEND: calculateUserPoints for user: " # Principal.toText(user));

    // Calculate challenge points by checking completion status
    var challengePoints : Nat = 0;
    Debug.print("🔍 BACKEND: Looking up challenge statuses for user...");

    let userStatusesOpt = Trie.find(challengeStatuses, { key = user; hash = Principal.hash(user) }, Principal.equal);

    switch (userStatusesOpt) {
      case (?userStatuses) {
        Debug.print("🔍 BACKEND: Found user challenge statuses, iterating...");
        var totalChallenges = 0;
        var verifiedChallenges = 0;

        for ((challengeId, status) in Trie.iter(userStatuses)) {
          totalChallenges += 1;
          let statusText = switch (status) {
            case (#verified) { "verified" };
            case (#pending) { "pending" };
            case (#failed(_)) { "failed" };
          };
          Debug.print("🔍 BACKEND: Challenge " # Nat.toText(challengeId) # " status: " # statusText);

          if (status == #verified) {
            verifiedChallenges += 1;
            Debug.print("🔍 BACKEND: Processing verified challenge " # Nat.toText(challengeId));

            // Find challenge and add its points
            switch (Array.indexOf<Challenge>(
              { id = challengeId; description = ""; challengeType = #follows({ user = "" }); points = 0 },
              challenges,
              func(a, b) = a.id == b.id
            )) {
              case (?idx) {
                let challenge = challenges[idx];
                Debug.print("🔍 BACKEND: Found challenge, adding " # Nat.toText(challenge.points) # " points");
                challengePoints += challenge.points;
              };
              case (null) {
                Debug.print("🔍 BACKEND: Challenge " # Nat.toText(challengeId) # " not found in challenges array!");
              };
            };
          };
        };

        Debug.print("🔍 BACKEND: Challenge summary - Total: " # Nat.toText(totalChallenges) # ", Verified: " # Nat.toText(verifiedChallenges) # ", Points: " # Nat.toText(challengePoints));
      };
      case (null) {
        Debug.print("🔍 BACKEND: No challenge statuses found for user!");
      };
    };

    // Calculate follower points from cached data
    Debug.print("🔍 BACKEND: Looking up user data for follower points...");
    let followerPoints = switch (Trie.find(userDataStore, { key = user; hash = Principal.hash(user) }, Principal.equal)) {
      case (?cachedUser) {
        Debug.print("🔍 BACKEND: Found cached user data");
        Debug.print("🔍 BACKEND: Cache timestamp: " # Int.toText(cachedUser.timestamp));
        Debug.print("🔍 BACKEND: Cache TTL: " # Nat.toText(cachedUser.ttl));
        Debug.print("🔍 BACKEND: Cache valid: " # (if (isCacheValid(cachedUser)) "true" else "false"));

        if (isCacheValid(cachedUser)) {
          let usernameText = switch (cachedUser.user.username) {
          case (?username) { username };
          case (null) { "null" };
        };
        let providerText = switch (cachedUser.user.provider) {
          case (#x) { "x" };
          case (#github) { "github" };
          case (#twitter) { "twitter" };
          case (#discord) { "discord" };
          case (#google) { "google" };
          case (#auth0) { "auth0" };
          case (#zitadel) { "zitadel" };
        };
        Debug.print("🔍 BACKEND: User data - Username: " # usernameText # ", Provider: " # providerText);

          switch (cachedUser.user.followers_count) {
            case (?count) {
              Debug.print("🔍 BACKEND: Follower count: " # Nat.toText(count));
              let calculatedFollowerPoints = calculateFollowerPoints(count);
              Debug.print("🔍 BACKEND: Calculated follower points: " # Nat.toText(calculatedFollowerPoints));
              calculatedFollowerPoints;
            };
            case (null) {
              Debug.print("🔍 BACKEND: No follower count in user data");
              0;
            };
          };
        } else {
          Debug.print("🔍 BACKEND: Cache is invalid, skipping follower points");
          0;
        };
      };
      case (null) {
        Debug.print("🔍 BACKEND: No cached user data found for user!");
        0;
      };
    };

    let totalPoints = challengePoints + followerPoints;
    Debug.print("🔍 BACKEND: Final calculation - Challenge: " # Nat.toText(challengePoints) # ", Follower: " # Nat.toText(followerPoints) # ", Total: " # Nat.toText(totalPoints));

    return {
      challengePoints = challengePoints;
      followerPoints = followerPoints;
      totalPoints = totalPoints;
    };
  };

  // Get user points (calculated dynamically)
  public query ({ caller }) func getUserPoints() : async {
    challengePoints : Nat;
    followerPoints : Nat;
    totalPoints : Nat;
  } {
    Debug.print("🔍 BACKEND: getUserPoints called");
    Debug.print("🔍 BACKEND: Caller principal: " # Principal.toText(caller));

    let calculatedPoints = calculateUserPoints(caller);
    Debug.print("🔍 BACKEND: Calculated points - Challenge: " # Nat.toText(calculatedPoints.challengePoints) # ", Follower: " # Nat.toText(calculatedPoints.followerPoints) # ", Total: " # Nat.toText(calculatedPoints.totalPoints));

    return {
      challengePoints = calculatedPoints.challengePoints;
      followerPoints = calculatedPoints.followerPoints;
      totalPoints = calculatedPoints.totalPoints;
    };
  };

  // Get leaderboard data (uses same calculation as getUserPoints for consistency)
  public query func getLeaderboard() : async [{
    principal : Principal;
    challengePoints : Nat;
    followerPoints : Nat;
    totalPoints : Nat;
    username : ?Text;
    name : ?Text;
  }] {
    // Convert Trie to array for sorting
    var leaderboard : [{
      principal : Principal;
      challengePoints : Nat;
      followerPoints : Nat;
      totalPoints : Nat;
      username : ?Text;
      name : ?Text;
    }] = [];

    // Iterate through all users with stored points
    for ((principal, _) in Trie.iter(userPoints)) {
      // Calculate points dynamically (same as getUserPoints)
      let calculatedPoints = calculateUserPoints(principal);

      // Update stored points with calculated values for consistency
      let updatedPoints = {
        challengePoints = calculatedPoints.challengePoints;
        followerPoints = calculatedPoints.followerPoints;
        totalPoints = calculatedPoints.totalPoints;
        lastUpdated = Time.now();
      };

      userPoints := Trie.replace(
        userPoints,
        { key = principal; hash = Principal.hash(principal) },
        Principal.equal,
        ?updatedPoints,
      ).0;

      // Get user data for display
      let userInfo = switch (Trie.find(userDataStore, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
        case (?cachedUser) {
          if (isCacheValid(cachedUser)) {
            {
              username = cachedUser.user.username;
              name = cachedUser.user.name;
            };
          } else {
            {
              username = null;
              name = null;
            };
          };
        };
        case (null) {
          {
            username = null;
            name = null;
          };
        };
      };

      leaderboard := Array.append(leaderboard, [{
        principal = principal;
        challengePoints = calculatedPoints.challengePoints;
        followerPoints = calculatedPoints.followerPoints;
        totalPoints = calculatedPoints.totalPoints;
        username = userInfo.username;
        name = userInfo.name
      }]);
    };

    // Sort by total points descending
    leaderboard := Array.sort<{
      principal : Principal;
      challengePoints : Nat;
      followerPoints : Nat;
      totalPoints : Nat;
      username : ?Text;
      name : ?Text
    }>(
      leaderboard,
      func(a, b) = Nat.compare(b.totalPoints, a.totalPoints),
    );

    return leaderboard;
  };

  // Check if Apify Bearer Token is set
  public query func isApifyBearerTokenSet() : async Bool {
    Text.size(apifyBearerToken) > 0;
  };

  // Get masked Apify Bearer Token (last 5 characters)
  public query func getApifyBearerTokenMasked() : async ?Text {
    let tokenLength = Text.size(apifyBearerToken);
    if (tokenLength < 20) {
      return null;
    } else {
      let chars = Text.toArray(apifyBearerToken);
      let last5 = Array.tabulate<Text>(5, func(i) { Text.fromChar(chars[tokenLength - 5 + i]) });
      let reversed = Array.reverse(last5);
      var masked = "...";
      for (char in reversed.vals()) {
        masked #= char;
      };
      return ?masked;
    };
  };

  // Verify challenge by checking Twitter following relationship
  public shared ({ caller }) func verifyChallenge(challengeId : Nat) : async {
    #success : Bool;
    #error : Text;
  } {
    // Rate limiting checks
    let now = Time.now();

    // 0. Check if user is permanently blocked
    switch (Trie.find(permanentBlocks, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?block) {
        return #error("Your account has been permanently blocked due to excessive failed verification attempts (" # Nat.toText(block.totalFailures) # " total failures). Contact an administrator to appeal this block.");
      };
      case (null) { /* Not permanently blocked */ };
    };

    // 1. Check if user is currently locked out
    switch (Trie.find(verificationLockouts, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?lockout) {
        if (now < lockout.lockedUntil) {
          let remainingNanos = lockout.lockedUntil - now;
          let remainingSeconds : Nat = if (remainingNanos > 0) {
            let seconds = remainingNanos / 1_000_000_000;
            if (seconds < 0) { 0 } else { Int.abs(seconds) };
          } else { 0 };
          return #error("Verification temporarily locked due to " # Nat.toText(lockout.failureCount) # " consecutive failures. Try again in " # Nat.toText(remainingSeconds) # " seconds.");
        } else {
          // Lockout expired, remove it
          verificationLockouts := Trie.replace(
            verificationLockouts,
            { key = caller; hash = Principal.hash(caller) },
            Principal.equal,
            null,
          ).0;
        };
      };
      case (null) { /* No lockout */ };
    };

    // 2. Check if user is already verifying another challenge
    switch (Trie.find(ongoingVerifications, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?ongoingChallengeId) {
        if (ongoingChallengeId != challengeId) {
          return #error("You are currently verifying another challenge. Please wait for it to complete.");
        };
      };
      case (null) { /* No ongoing verification */ };
    };

    // 3. Check consecutive failures for escalating delay
    let consecutiveFailuresOpt = Trie.find(consecutiveFailures, { key = caller; hash = Principal.hash(caller) }, Principal.equal);
    let currentFailureCount = switch (consecutiveFailuresOpt) {
      case (?failures) {
        // Check if failures are recent (within last hour)
        let timeSinceLastFailure = now - failures.lastFailure;
        if (timeSinceLastFailure < 3_600_000_000_000) {
          // 1 hour in nanoseconds
          failures.count;
        } else {
          0 // Reset if more than an hour has passed
        };
      };
      case (null) { 0 };
    };

    // Apply escalating delay: 5 minutes * failure count
    if (currentFailureCount > 0) {
      let delayDuration = BASE_VERIFICATION_COOLDOWN * currentFailureCount;
      let lastFailureTime = switch (consecutiveFailuresOpt) {
        case (?failures) { failures.lastFailure };
        case (null) { now };
      };
      let timeSinceLastFailure = now - lastFailureTime;

      if (timeSinceLastFailure < delayDuration) {
        let remainingNanos = delayDuration - timeSinceLastFailure;
        let remainingSeconds : Nat = if (remainingNanos > 0) {
          let seconds = remainingNanos / 1_000_000_000;
          if (seconds < 0) { 0 } else { Int.abs(seconds) };
        } else { 0 };
        return #error("Verification delayed due to " # Nat.toText(currentFailureCount) # " recent failures. Try again in " # Nat.toText(remainingSeconds) # " seconds.");
      };
    };

    // 4. Set ongoing verification
    ongoingVerifications := Trie.replace(
      ongoingVerifications,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      ?challengeId,
    ).0;

    // Check if challenge is already verified
    switch (await getChallengeStatus(challengeId)) {
      case (?#verified) {
        // Remove ongoing verification
        ongoingVerifications := Trie.replace(
          ongoingVerifications,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          null,
        ).0;
        return #error("Challenge already verified");
      };
      case (_) { /* Continue with verification */ };
    };

    // Find the challenge
    let ?index = Array.indexOf<Challenge>({ id = challengeId; description = ""; challengeType = #follows({ user = "" }); points = 0 }, challenges, func(a, b) = a.id == b.id) else {
      return #error("Challenge not found");
    };
    let challenge = challenges[index];

    // Set status to pending
    setChallengeStatus(caller, challengeId, #pending);

    // Check if it's a follows challenge
    let #follows(targetUser) = challenge.challengeType;

    // Get user's Twitter data
    let ?cachedUser = Trie.find(userDataStore, { key = caller; hash = Principal.hash(caller) }, Principal.equal) else {
      // Update attempt counters and remove ongoing verification
      updateVerificationAttempts(caller, challengeId, false);
      ongoingVerifications := Trie.replace(
        ongoingVerifications,
        { key = caller; hash = Principal.hash(caller) },
        Principal.equal,
        null,
      ).0;
      setChallengeStatus(caller, challengeId, #failed("No user data found, please sign in with Twitter/X"));
      return #error("No user data found, please sign in with Twitter/X");
    };

    if (not isCacheValid(cachedUser)) {
      // Update attempt counters and remove ongoing verification
      updateVerificationAttempts(caller, challengeId, false);
      ongoingVerifications := Trie.replace(
        ongoingVerifications,
        { key = caller; hash = Principal.hash(caller) },
        Principal.equal,
        null,
      ).0;
      setChallengeStatus(caller, challengeId, #failed("User data is stale, please refresh your profile"));
      return #error("User data is stale, please refresh your profile");
    };

    // Check if user has Twitter data
    switch (cachedUser.user.provider) {
      case (#x) { /* continue */ };
      case (_) {
        // Update attempt counters and remove ongoing verification
        updateVerificationAttempts(caller, challengeId, false);
        ongoingVerifications := Trie.replace(
          ongoingVerifications,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          null,
        ).0;
        setChallengeStatus(caller, challengeId, #failed("User does not have a Twitter/X account linked"));
        return #error("User does not have a Twitter/X account linked");
      };
    };

    // Check if user is trying to follow themselves
    switch (cachedUser.user.username) {
      case (?username) {
        if (username == targetUser.user) {
          // Update attempt counters and remove ongoing verification
          updateVerificationAttempts(caller, challengeId, false);
          ongoingVerifications := Trie.replace(
            ongoingVerifications,
            { key = caller; hash = Principal.hash(caller) },
            Principal.equal,
            null,
          ).0;
          setChallengeStatus(caller, challengeId, #failed("Cannot follow yourself"));
          return #error("Cannot follow yourself");
        };
      };
      case (null) { /* continue */ };
    };

    // User has Twitter/X account, proceed with verification
    Debug.print("User has valid Twitter/X account, starting following verification for challenge " # Nat.toText(challengeId));
    let result = await verifyTwitterFollowing(caller, cachedUser.user.username, targetUser.user);
    switch (result) {
      case (#success(isFollowing)) {
        if (isFollowing) {
          Debug.print("Challenge " # Nat.toText(challengeId) # " verified: User follows " # targetUser.user);
          setChallengeStatus(caller, challengeId, #verified);
          // Reset attempt counters on success
          resetVerificationAttempts(caller, challengeId);
          // Remove ongoing verification
          ongoingVerifications := Trie.replace(
            ongoingVerifications,
            { key = caller; hash = Principal.hash(caller) },
            Principal.equal,
            null,
          ).0;
          // Award points for successful challenge completion
          awardChallengePoints(caller, challengeId);
          return #success(true);
        } else {
          Debug.print("Challenge " # Nat.toText(challengeId) # " failed: User does not follow " # targetUser.user);
          // Update attempt counters
          updateVerificationAttempts(caller, challengeId, false);
          // Remove ongoing verification
          ongoingVerifications := Trie.replace(
            ongoingVerifications,
            { key = caller; hash = Principal.hash(caller) },
            Principal.equal,
            null,
          ).0;
          setChallengeStatus(caller, challengeId, #failed("Not following the required user"));
          return #success(false);
        };
      };
      case (#error(err)) {
        Debug.print("Challenge " # Nat.toText(challengeId) # " verification error: " # err);
        // Update attempt counters
        updateVerificationAttempts(caller, challengeId, false);
        // Remove ongoing verification
        ongoingVerifications := Trie.replace(
          ongoingVerifications,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          null,
        ).0;
        setChallengeStatus(caller, challengeId, #failed(err));
        return #error(err);
      };
    };
  };

  // Helper function to verify Twitter following relationship using Apify
  private func verifyTwitterFollowing(caller : Principal, sourceUsername : ?Text, targetUsername : Text) : async {
    #success : Bool;
    #error : Text;
  } {
    Debug.print("Starting Twitter following verification for caller: " # Principal.toText(caller));

    // Check if source username is available
    let sourceUser = switch (sourceUsername) {
      case (?user) user;
      case (null) {
        Debug.print("Verification failed: Source user username not available");
        return #error("Source user username not available");
      };
    };

    Debug.print("Source username available: " # sourceUser);

    // Check if Apify token and cookies are set
    if (Text.size(apifyBearerToken) == 0) {
      Debug.print("Verification failed: Apify API token not configured");
      return #error("Apify API token not configured");
    };
    if (Text.size(apifyCookies) == 0) {
      Debug.print("Verification failed: Apify cookies not configured");
      return #error("Apify cookies not configured");
    };

    Debug.print("Apify credentials configured, proceeding with verification: " # sourceUser # " -> " # targetUsername);

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
    Debug.print("Making HTTP request to Apify API for following check");
    let http_response : IC.http_request_result = await (with cycles = 200_000_000_000) IC.http_request(http_request);
    Debug.print("HTTP request completed, status: " # Nat.toText(http_response.status));

    // 3. PROCESS THE RESPONSE
    let decoded_text = switch (Text.decodeUtf8(http_response.body)) {
      case (null) {
        Debug.print("Verification failed: Failed to decode response body");
        return #error("Failed to decode response body");
      };
      case (?text) text;
    };

    Debug.print("Response decoded successfully, processing JSON");

    // 4. CHECK HTTP STATUS CODE
    if (http_response.status != 201) {
      Debug.print("Verification failed: HTTP status " # Nat.toText(http_response.status));
      let error_msg = switch (http_response.status) {
        case (401) "Apify API authentication failed - check bearer token";
        case (403) "Apify API access forbidden";
        case (404) "Apify actor not found";
        case (429) "Apify API rate limit exceeded";
        case (_) ("Apify API error: HTTP " # Nat.toText(http_response.status));
      };
      return #error(error_msg);
    };

    Debug.print("HTTP status OK, parsing JSON response");

    // 5. PARSE JSON RESPONSE TO GET DATASET ID
    let json = switch (Json.parse(decoded_text)) {
      case (#ok(j)) j;
      case (#err(_)) {
        Debug.print("Verification failed: Failed to parse Apify API response");
        return #error("Failed to parse Apify API response");
      };
    };

    let datasetId = switch (Json.get(json, "data.defaultDatasetId")) {
      case (?#string(id)) id;
      case (_) {
        Debug.print("Verification failed: Failed to extract dataset ID from Apify response");
        return #error("Failed to extract dataset ID from Apify response");
      };
    };

    Debug.print("Dataset ID extracted: " # datasetId # ", fetching results");

    // 6. GET DATASET RESULTS
    let result = await getApifyDatasetResults(datasetId);
    switch (result) {
      case (#success(isFollowing)) {
        Debug.print("Verification result: " # sourceUser # " follows " # targetUsername # " = " # (if (isFollowing) "true" else "false"));
        return #success(isFollowing);
      };
      case (#error(err)) {
        Debug.print("Verification failed in dataset results: " # err);
        return #error(err);
      };
    };
  };

  // Helper function to get Apify dataset results
  private func getApifyDatasetResults(datasetId : Text) : async {
    #success : Bool;
    #error : Text;
  } {
    Debug.print("Fetching dataset results for ID: " # datasetId);
    let url = "https://api.apify.com/v2/datasets/" # datasetId # "/items";

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

    Debug.print("Making HTTP GET request for dataset results");
    let http_response : IC.http_request_result = await (with cycles = 100_000_000_000) IC.http_request(http_request);
    Debug.print("Dataset HTTP request completed, status: " # Nat.toText(http_response.status));

    let decoded_text = switch (Text.decodeUtf8(http_response.body)) {
      case (null) {
        Debug.print("Dataset fetch failed: Failed to decode response body");
        return #error("Failed to decode dataset response");
      };
      case (?text) text;
    };

    if (http_response.status != 200) {
      Debug.print("Dataset fetch failed: HTTP " # Nat.toText(http_response.status));
      return #error("Failed to get dataset results: HTTP " # Nat.toText(http_response.status));
    };

    Debug.print("Dataset response decoded, parsing JSON");
    // Parse the dataset results
    let json = switch (Json.parse(decoded_text)) {
      case (#ok(j)) j;
      case (#err(_)) {
        Debug.print("Dataset fetch failed: Failed to parse dataset JSON");
        return #error("Failed to parse dataset JSON");
      };
    };

    let isFollowing = switch (Json.get(json, "[0].user_a_follows_user_b")) {
      case (?#bool(following)) following;
      case (_) {
        Debug.print("Dataset fetch failed: user_a_follows_user_b field not found");
        return #error("user_a_follows_user_b field not found in dataset item: " # decoded_text);
      };
    };

    Debug.print("Dataset parsed successfully, user_a_follows_user_b: " # (if (isFollowing) "true" else "false"));
    return #success(isFollowing);
  };

  // Store followers data from Twitter API response
  private func _storeFollowersData(targetUserId : Text, json : Json.Json) : () {
    // Extract followers from the JSON response
    // Twitter API response format: {"data": [{"id": "123", "username": "user"}, ...], ...}
    let ?followersJson = Json.get(json, "data") else {
      Debug.print("No data field in Twitter API response");
      return;
    };

    let #array(followers) = followersJson else {
      Debug.print("No followers data found in response");
      return;
    };

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

  // Check if a user follows another user using cached data
  private func _checkIfUserFollows(sourceUserId : Text, targetUserId : Text) : Bool {
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

  // Update verification attempts counter
  private func updateVerificationAttempts(caller : Principal, challengeId : Nat, success : Bool) : () {
    let now = Time.now();

    // Get or create user attempts map
    let userAttempts = switch (Trie.find(verificationAttempts, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
      case (?attempts) { attempts };
      case (null) { Trie.empty() };
    };

    // Get current attempts for this challenge
    let currentAttempts = switch (Trie.find(userAttempts, { key = challengeId; hash = Hash.hash(challengeId) }, Nat.equal)) {
      case (?attemptData) { attemptData };
      case (null) {
        { attempts = 0; lastAttempt = now };
      };
    };

    if (not success) {
      // Increment attempts on failure
      let newAttempts = currentAttempts.attempts + 1;
      let updatedAttemptData = {
        attempts = newAttempts;
        lastAttempt = now;
      };

      let updatedUserAttempts = Trie.replace(
        userAttempts,
        { key = challengeId; hash = Hash.hash(challengeId) },
        Nat.equal,
        ?updatedAttemptData,
      ).0;

      verificationAttempts := Trie.replace(
        verificationAttempts,
        { key = caller; hash = Principal.hash(caller) },
        Principal.equal,
        ?updatedUserAttempts,
      ).0;

      // Update consecutive failures
      let currentFailures = switch (Trie.find(consecutiveFailures, { key = caller; hash = Principal.hash(caller) }, Principal.equal)) {
        case (?failures) { failures };
        case (null) { { count = 0; lastFailure = now } };
      };

      let newFailureCount = currentFailures.count + 1;
      let updatedFailures = {
        count = newFailureCount;
        lastFailure = now;
      };

      consecutiveFailures := Trie.replace(
        consecutiveFailures,
        { key = caller; hash = Principal.hash(caller) },
        Principal.equal,
        ?updatedFailures,
      ).0;

      // Check if we should permanently block the user
      if (newFailureCount >= PERMANENT_BLOCK_THRESHOLD) {
        let blockData = {
          blockedAt = now;
          reason = "Permanent block due to excessive consecutive verification failures";
          totalFailures = newFailureCount;
        };
        permanentBlocks := Trie.replace(
          permanentBlocks,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          ?blockData,
        ).0;
        Debug.print("User " # Principal.toText(caller) # " permanently blocked due to " # Nat.toText(newFailureCount) # " consecutive failures");
      } else if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
        // Severe lockout for cases between MAX_CONSECUTIVE_FAILURES and PERMANENT_BLOCK_THRESHOLD
        let severeLockoutDuration = BASE_VERIFICATION_COOLDOWN * 6; // 30 minutes for severe cases
        let lockoutData = {
          lockedUntil = now + severeLockoutDuration;
          reason = "Severe lockout due to excessive consecutive failures";
          failureCount = newFailureCount;
        };
        verificationLockouts := Trie.replace(
          verificationLockouts,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          ?lockoutData,
        ).0;
        Debug.print("User " # Principal.toText(caller) # " severely locked out due to " # Nat.toText(newFailureCount) # " consecutive failures");
      };
    };
  };

  // Reset verification attempts on successful verification
  private func resetVerificationAttempts(caller : Principal, challengeId : Nat) : () {
    let userAttemptsOpt = Trie.find(verificationAttempts, { key = caller; hash = Principal.hash(caller) }, Principal.equal);
    switch (userAttemptsOpt) {
      case (?userAttempts) {
        let updatedUserAttempts = Trie.replace(
          userAttempts,
          { key = challengeId; hash = Hash.hash(challengeId) },
          Nat.equal,
          null, // Remove the attempts for this challenge
        ).0;

        verificationAttempts := Trie.replace(
          verificationAttempts,
          { key = caller; hash = Principal.hash(caller) },
          Principal.equal,
          ?updatedUserAttempts,
        ).0;
      };
      case (null) { /* No attempts to reset */ };
    };

    // Reset consecutive failures on success
    consecutiveFailures := Trie.replace(
      consecutiveFailures,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      null,
    ).0;

    // Also clear any lockout on success
    verificationLockouts := Trie.replace(
      verificationLockouts,
      { key = caller; hash = Principal.hash(caller) },
      Principal.equal,
      null,
    ).0;
  };

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };

  // Admin function to unblock a permanently blocked user
  public shared ({ caller }) func unblockUser(userPrincipal : Principal) : async Bool {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can unblock users");
    };

    // Check if user is actually blocked
    switch (Trie.find(permanentBlocks, { key = userPrincipal; hash = Principal.hash(userPrincipal) }, Principal.equal)) {
      case (?block) {
        // Remove from permanent blocks
        permanentBlocks := Trie.replace(
          permanentBlocks,
          { key = userPrincipal; hash = Principal.hash(userPrincipal) },
          Principal.equal,
          null,
        ).0;

        // Also clear consecutive failures to give them a fresh start
        consecutiveFailures := Trie.replace(
          consecutiveFailures,
          { key = userPrincipal; hash = Principal.hash(userPrincipal) },
          Principal.equal,
          null,
        ).0;

        Debug.print("Admin " # Principal.toText(caller) # " unblocked user " # Principal.toText(userPrincipal));
        return true;
      };
      case (null) {
        Debug.print("User " # Principal.toText(userPrincipal) # " is not permanently blocked");
        return false;
      };
    };
  };

  // Admin function to get list of permanently blocked users
  public query ({ caller }) func getBlockedUsers() : async [{
    principal : Principal;
    blockedAt : Time.Time;
    reason : Text;
    totalFailures : Nat;
  }] {
    // Check if caller is admin
    if (not isCallerAdmin(caller)) {
      Debug.trap("Only admin can view blocked users");
    };

    // Convert Trie to array for return
    var blockedUsers : [{
      principal : Principal;
      blockedAt : Time.Time;
      reason : Text;
      totalFailures : Nat;
    }] = [];

    for ((principal, blockData) in Trie.iter(permanentBlocks)) {
      blockedUsers := Array.append(blockedUsers, [{ principal = principal; blockedAt = blockData.blockedAt; reason = blockData.reason; totalFailures = blockData.totalFailures }]);
    };

    return blockedUsers;
  };

  // Check if a user is permanently blocked (public query)
  public query func isUserBlocked(principal : Principal) : async ?{
    blockedAt : Time.Time;
    reason : Text;
    totalFailures : Nat;
  } {
    switch (Trie.find(permanentBlocks, { key = principal; hash = Principal.hash(principal) }, Principal.equal)) {
      case (?blockData) {
        return ?{
          blockedAt = blockData.blockedAt;
          reason = blockData.reason;
          totalFailures = blockData.totalFailures;
        };
      };
      case (null) { return null };
    };
  };
};
