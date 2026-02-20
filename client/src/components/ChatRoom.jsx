import React,{useState,useEffect} from 'react';
import socket from '../socket';

export default function ChatRoom(){
  const[room,setRoom]=useState('main');
  const[messages,setMessages]=useState([]);
  useEffect(()=>{
    socket.on('message',m=>setMessages(x=>[...x,m]));
    return()=>socket.off('message');
  },[]);
  return <div>ChatRoom</div>;
}