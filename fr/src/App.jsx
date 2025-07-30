  import './App.css';
  import { useEffect, useRef, useState } from 'react';

  function App() {
    const [ms, setms] = useState('');
    const [history, sethistory] = useState(() => {
      const saved = localStorage.getItem('chatHistory');
      return saved ? JSON.parse(saved) : [];
    });
    const [loading, setloading] = useState(false);
    const chatEndRef = useRef(null);
    const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const send = async () => {
      if (!ms.trim()) return;
      const userMsg = {
        sender: 'user',
        text: ms,
        time: new Date().toLocaleTimeString(),
      };
      sethistory((prev) => [...prev, userMsg]);
      setms('');
      setloading(true);
      try {
        const response = await fetch('/api/ip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ms }),
        });
        const data = await response.json();
        const botMsg = {
          sender: 'bot',
          text: data.reply || 'No reply',
          time: new Date().toLocaleTimeString(),
        };
        sethistory((prev) => [...prev, botMsg]);
      } catch {
        sethistory((prev) => [
          ...prev,
          { sender: 'bot', text: 'Server error', time: new Date().toLocaleTimeString() },
        ]);
      } finally {
        setloading(false);
      }
    };

    const enter = (e) => {
      if (e.key === 'Enter') send();
    };

    const clearChat = () => {
      sethistory([]);
      localStorage.removeItem('chatHistory');
    };

    useEffect(() => {
      scrollToBottom();
      localStorage.setItem('chatHistory', JSON.stringify(history));
    }, [history]);

    return (
      <>
        <div className='bg-pink-200 rounded-3xl shadow-md p-3 w-80 mx-auto text-center text-lg font-bold'>
          WELCOME TO MY CHATAPP 💬
        </div>
        <div className='w-full max-w-xs sm:max-w-md md:max-w-lg h-[400px] sm:h-[600px] p-2 sm:p-5 bg-gradient-to-t from-red-200 to-green-200 mx-auto mt-10 rounded-3xl shadow-2xl flex flex-col'>
           
          <div className='p-4 bg-white w-full h-full rounded-2xl flex flex-col overflow-y-auto space-y-3'>
            {history.map((msg, index) => (
              <div
                key={index}
                className={`flex items-end ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && <div className='mr-1'><span className='text-2xl'>🤖</span></div>}
                <div className={`p-2 rounded-xl text-sm shadow max-w-[75%]
                  ${msg.sender === 'user' ? 'bg-gradient-to-t from-green-200 to-yellow-100 text-right' : 'bg-gradient-to-t from-blue-200 to-yellow-100 text-left'}`}>
                  <p className='text-gray-800'>{msg.text}</p>
                  <p className='text-gray-400 text-xs mt-1'>{msg.time}</p>
                </div>
                {msg.sender === 'user' && <div className='ml-1'><span className='text-2xl'>🧑</span></div>}
              </div>
            ))}
            {loading && (
              <div className='flex items-center space-x-2 text-sm italic text-gray-400'>
                <span className='text-2xl'>🤖</span>
                <p>Bot is typing...</p>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>
          <div className='flex mt-3 rounded-3xl shadow-md'>
            
            <input
              type='text'
              value={ms}
              onChange={(e) => setms(e.target.value)}
              onKeyDown={enter}
              placeholder='Type or speak...'
              className='flex-1 h-10 rounded-l-2xl bg-blue-100 p-3 border-y-2 border-blue-300'
            />
            <button
              
className='bg-blue-100 border-y-2 border-blue-300 hover:bg-blue-200 px-2'              title="Speak"
            >
              🎤
            </button>
            <button
              onClick={clearChat} className='bg-blue-100 border-y-2 border-blue-300 hover:bg-blue-200'
            >
              🗑
            </button>
            <button
              onClick={send}
              className='bg-blue-400 w-20 h-10 rounded-r-2xl text-white font-bold hover:bg-blue-500'
            >
              ASK
            </button>
          </div>
        </div>
      </>
    );
  }
  export default App;