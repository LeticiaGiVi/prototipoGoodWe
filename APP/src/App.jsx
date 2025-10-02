import { Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";

function App() {
  return (
    <div className="min-h-screen flex">
      <div className="w-1/5">
        <SideBar />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

export default App