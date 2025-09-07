import { useState } from "react";
import { poi_backend } from "declarations/poi_backend";
import { AuthProvider, useAuth } from "./AuthContext";

function AuthApp() {
  const {
    isAuthenticated,
    identity,
    userData,
    userDataLoading,
    login,
    logout,
    loading,
  } = useAuth();
  const [greeting, setGreeting] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    poi_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
    return false;
  }

  if (loading) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />

      {!isAuthenticated ? (
        <div>
          <p>Please sign in to continue</p>
          <button onClick={login}>Sign In</button>
        </div>
      ) : (
        <div>
          <p>Welcome! You are signed in.</p>
          <p>Your Principal ID: {identity?.getPrincipal().toString()}</p>

          {userDataLoading ? (
            <p>Loading user data...</p>
          ) : userData ? (
            <div>
              <h3>User Profile</h3>
              {userData.name && userData.name.length > 0 && (
                <p>
                  <strong>Name:</strong> {userData.name[0]}
                </p>
              )}
              {userData.username && userData.username.length > 0 && (
                <p>
                  <strong>Username:</strong> {userData.username[0]}
                </p>
              )}
              {userData.email && userData.email.length > 0 && (
                <p>
                  <strong>Email:</strong> {userData.email[0]}
                </p>
              )}
              {userData.bio && userData.bio.length > 0 && (
                <p>
                  <strong>Bio:</strong> {userData.bio[0]}
                </p>
              )}
              {userData.location && userData.location.length > 0 && (
                <p>
                  <strong>Location:</strong> {userData.location[0]}
                </p>
              )}
              {userData.website && userData.website.length > 0 && (
                <p>
                  <strong>Website:</strong> {userData.website[0]}
                </p>
              )}
              <p>
                <strong>Provider:</strong> {Object.keys(userData.provider)[0]}
              </p>
              {userData.followers_count &&
                userData.followers_count.length > 0 && (
                  <p>
                    <strong>Followers:</strong>{" "}
                    {userData.followers_count[0].toString()}
                  </p>
                )}
              {userData.following_count &&
                userData.following_count.length > 0 && (
                  <p>
                    <strong>Following:</strong>{" "}
                    {userData.following_count[0].toString()}
                  </p>
                )}
            </div>
          ) : (
            <p>No user data found.</p>
          )}

          <br />
          <button onClick={logout}>Sign Out</button>
          <br />
          <br />

          <form action="#" onSubmit={handleSubmit}>
            <label htmlFor="name">Enter your name: &nbsp;</label>
            <input id="name" alt="Name" type="text" />
            <button type="submit">Click Me!</button>
          </form>
          <section id="greeting">{greeting}</section>
        </div>
      )}
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthApp />
    </AuthProvider>
  );
}

export default App;
