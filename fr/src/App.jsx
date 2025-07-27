import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useEffect, useState } from 'react';

function App() {
    const [ms,setms]=useState("");
    const [m,setm]=useState("");
    const [reply,setreply]=useState("");

  
  const send = async () => {
    try {
      const response = await fetch("/api/ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ms }),
      });

      const data = await response.json();
      console.log("Server response:", data);
      setreply(data.reply);
      setms("");

    }catch(err)
  {
    console.log(err)
  }}
  const enter = (e) =>
  {
    if(e.key === "Enter")
    {
      send();
    }
  }


  useEffect(()=>
  {
    fetch('/api/first')
    .then(res =>res.json())
    .then(data => setm(data.mj))
    .catch(err => console.log("ip not get"))
  },[]);

  

  return (
    // <>
    //   <div className="bg-green-400 h-30 w-70 align-middle">
    //   <h1>{m}</h1>
    //   <button className="bg-red-300" onClick={()=>setCount("vanakkam da mapla")}>hower,click</button>
    //   <h1 >{count}</h1>
    //   <button className='bg-yellow-500 h-10 w-30'onClick={()=>setr(!cc)}>clickeffect</button>
      
    //   </div>
    //   <div className={`h-50 w-50 mt-20 ${cc ? 'bg-red-300 animate-ping' : 'bg-green-400 animate-bounce'}`}></div>
    // </>
    <>
    <div className='bg-pink-200 rounded-3xl shadow-md shadow-gray-200 p-3 w-80 mx-auto' ><h1>WELCOME TO MY CHATAPP</h1></div>
    <div className="sm:w-120 xl:w-130 h-[600px] p-5 bg-gradient-to-t from-red-200 to-green-200 mx-auto mt-10 rounded-3xl shadow-2xl" >
      <div className='p-3 bg-gradient-to-r from-yellow-100 to-orange-200 w-full h-full rounded-2xl'> 
        <div className='h-124'>
          {reply && 
          <div className='bg-green-200 p-3 shadow-inner'><p>{reply}</p></div>}
        </div>
        <div className='flex rounded-3xl shadow-md'>
        <input type='text' value={ms} onChange={(e) => setms(e.target.value)} onKeyDown={enter} className='flex flex-col h-10 w-80 bg-blue-100 rounded-l-2xl p-3 border-2 border-blue-300 hover:bg-amber-100 placeholder:enter your query' />
        <button onClick={send} className='bg-blue-400 w-20 h-10 rounded-r-2xl flex flex-col border-green-400 text-center p-2 text-violet-500 font-extrabold hover:cursor-crosshair'>ASK</button>
      </div>
      </div>
    </div>
    </>
  )
}

export default App;
