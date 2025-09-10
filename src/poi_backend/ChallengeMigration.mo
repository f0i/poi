import Array "mo:base/Array";

module ChallengeMigration {
  // Old Challenge type for migration
  type ChallengeV1 = {
    id : Nat;
    description : Text;
    challengeType : {
      #follows : { user : Text };
    };
    points : Nat;
  };

  // New Challenge type
  type Challenge = {
    id : Nat;
    description : Text;
    challengeType : {
      #follows : { user : Text };
    };
    points : Nat;
    markdownMessage : ?Text;
    disabled : Bool;
  };

  // Migration function that transforms old challenges to new format
  public func migration(old : {
      var challenges : [ChallengeV1] // old type
    }) :
    {
      var challenges : [Challenge] // new type
    } {
    { var challenges : [Challenge] =
        Array.map<ChallengeV1, Challenge>(
          old.challenges,
          func(challenge : ChallengeV1) : Challenge {
            {
              id = challenge.id;
              description = challenge.description;
              challengeType = challenge.challengeType;
              points = challenge.points;
              markdownMessage = null; // Default value for new field
              disabled = false; // Default value for new field
            }
          }
        )
    }
  };
};