import Navbar from "../Navbar/Navbar"

function Header() {
    return ( 
    <header className="flex bg-primary text-white p-4 mb-5 justify-between w-full">
        <span>Olá visitante</span>
        <Navbar/>
    </header>
    );
}

export default Header;