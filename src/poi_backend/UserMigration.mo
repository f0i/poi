import Array "mo:base/Array";
import Trie "mo:base/Trie";
import Time "mo:base/Time";
import UserDataBackend "canister:user_data_backend";

module ChallengeMigration {
  type Time = Time.Time;
  type OldUser = {
    avatar_url : ?Text;
    bio : ?Text;
    createdAt : Time;
    email : ?Text;
    email_verified : ?Bool;
    followers_count : ?Nat;
    following_count : ?Nat;
    id : Text;
    location : ?Text;
    name : ?Text;
    origin : Text;
    provider : { #auth0; #github; #google; #x; #zitadel; #discord; #twitter };
    provider_created_at : ?Text;
    public_gists : ?Nat;
    public_repos : ?Nat;
    tweet_count : ?Nat;
    username : ?Text;
    verified : ?Bool;
    website : ?Text;
  };

  type NewUser = UserDataBackend.User;

  type CachedUser = {
    user : NewUser;
    timestamp : Time.Time;
    ttl : Nat;
  };
  func transform(key : Principal, old : { user : OldUser; timestamp : Time.Time; ttl : Nat }) : ?CachedUser {
    return ?{
      user = { old.user with provider = "x" };
      timestamp = old.timestamp;
      ttl = old.ttl;
    };
  };

  // Migration function that transforms old challenges to new format
  public func migration(
    old : {
      var userDataStore : Trie.Trie<Principal, { user : OldUser; timestamp : Time.Time; ttl : Nat }>;
    }
  ) : {
    var userDataStore : Trie.Trie<Principal, CachedUser>;
  } {
    return {
      var userDataStore = Trie.mapFilter(old.userDataStore, transform);
    };
  };
};

