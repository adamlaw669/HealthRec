import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav className="p-4 bg-blue-500 text-white">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/metrics" className="hover:underline">
            Metrics
          </Link>
        </li>
        <li>
          <Link to="/profile" className="hover:underline">
            Profile
          </Link>
        </li>
        <li>
          <Link to="/settings" className="hover:underline">
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  )
}

