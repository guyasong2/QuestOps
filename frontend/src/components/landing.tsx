


export default function Landing() {
  return (
      <>
          <div>
          <nav className="navbar navbar-expand-lg navbar-light bg-light flex flex-row w-full h-16 justify-between items-center border-b-3 border-black px-6" style={{ fontFamily: 'Chakra Petch, sans-serif' }}>
                  <div className="navbar-brand font-bold">
                      <img src="/QuestOps_logo.png" alt="Logo" className="h-10 w-auto" />
                  </div>
                  
                  <ul className="navbar-nav flex gap-6 items-center">
                      <li className="nav-item border-b-2 border-black font-bold">
                          <a className="nav-link" href="/">Home</a>
                      </li>
                      <li className="nav-item font-bold">
                          <a className="nav-link" href="/login">Login</a>
                      </li>
                      <li className="nav-item font-bold">
                          <button className="nav-link bg-green-600 text-white px-4 py-2 rounded hover:bg-green-400">Get Started</button>
                      </li>
                  </ul> 
          </nav>
          </div>    
      </>
  )
}