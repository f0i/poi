import Leaderboard from "./Leaderboard";

function Dashboard({ onNavigate }) {
  return (
    <div className="space-y-6">
      <Leaderboard onNavigate={onNavigate} />
    </div>
  );
}

export default Dashboard;
