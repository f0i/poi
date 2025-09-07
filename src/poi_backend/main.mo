import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Debug "mo:base/Debug";

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

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
