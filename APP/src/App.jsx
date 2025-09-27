
import{ Outlet } from "react-router-dom";
import SideBar from "./components/SideBar";

function App() {

  return (
    <>
    <div className="h-80 flex flex-col justify-between itens-left">
     <div>
        <SideBar/>
     </div>
    <Outlet/>
    </div>
    </>
  )
}

export default App
