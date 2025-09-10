
export function LobbyMembers({className = ""}) {
      return (
    <div className={`flex flex-col gap-6 p-6 bg-gray-50 rounded-lg shadow-md ${className}`}>
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-800">LOBBYNAME</h1>
        <h2 className="text-sm text-gray-500">Lobby ID: 12345</h2>
      </div>

      {/* Members list */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Members:</h3>
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li className="text-gray-600">Member 1</li>
          <li className="text-gray-600">Member 2</li>
          <li className="text-gray-600">Member 3</li>
          <li className="text-gray-600">Member 4</li>
        </ul>
      </div>
    </div>
  );
}