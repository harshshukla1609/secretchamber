import { Box, IconButton, useToast ,Text, Input, FormControl} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { ChatState } from '../context/ChatProvider'
import { getSender, getSenderFull } from '../config/ChatLogics'
import ProfileModal from './miscellaneous/ProfileModal'
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal'
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import { ArrowBackIcon } from '@chakra-ui/icons'
import './style.css'
import io from 'socket.io-client'
import ScrollableChat from './ScrollableChat.js'
import axios from 'axios'

const ENDPOINT="http://localhost:4000"
var socket,selectedChatCompare;
const SingleChat = ({fetchAgain,setFetchAgain}) => {
    const [loading,setLoading]=useState(false)
    const [messages,setMessages]=useState([])
    const [newMessage,setNewMessage]=useState("")
    const [socketConnected,setsocketConnected]=useState(false)
    const [typing,setTyping]=useState(false)
    const [isTyping,setIsTyping]=useState(false)
    const toast=useToast()
    const {selectedChat,setSelectedChat,user,notification,
        setNotification}=ChatState()
    const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

    const fetchMessages=async()=>{
      if(!selectedChat)return

      try {
        const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
        setLoading(true)
        const {data}=await axios.get(`/api/message/${selectedChat._id}`,config)
        //console.log(messages)
        setMessages(data)
        setLoading(false)

        socket.emit('join chat',selectedChat._id)
      } catch (error) {
        toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      }
    }

    useEffect(()=>{
      socket=io(ENDPOINT)
      socket.emit("setup",user)
      socket.on("connected",()=>setsocketConnected(true))
      socket.on("typing",()=>setIsTyping(true))
      socket.on("stop typing",()=>setIsTyping(false))
    },[])

    useEffect(()=>{
      fetchMessages();
      selectedChatCompare=selectedChat;
    },[selectedChat])

    useEffect(()=>{
      socket.on("message recieved",(newMessageRecieved)=>{
        if(!selectedChatCompare||selectedChatCompare._id!==newMessageRecieved.chat._id){
          //give notification
          if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
        }
        else{
          setMessages([...messages,newMessageRecieved])
        }
      })
    })
    console.log(notification,"------------>")
    const sendMessage=async(event)=>{
      if (event.key==='Enter'&&newMessage){
        socket.emit("stop typing", selectedChat._id);
        try {
          const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
           setNewMessage("")
          const {data}=await axios.post('/api/message',
          {
            content:newMessage,
            chatId:selectedChat._id,
          },
          config
          )
          
          //console.log(data)
          socket.emit('new message',data)
          setMessages([...messages,data])
        } catch (error) {
          toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        }
      }
    }


    const typingHandler=(e)=>{
      setNewMessage(e.target.value)

      if(!socketConnected)return 
      if(!typing){
        setTyping(true)
        socket.emit("typing",selectedChat._id)
      }

      let lastTypingTime=new Date().getTime()
      var timerLength=3000
      setTimeout(()=>{
        var timeNow=new Date().getTime()
        var timeDiff=timeNow-lastTypingTime

        if(timeDiff>=timerLength&&typing){
          socket.emit("stop typing",selectedChat._id)
          setTyping(false)
        }
      },timerLength)
    }
  return (
    <>
      {selectedChat?(
        <>
          <Text
            fontSize="29px"
                    pb = {3}
                    px = {2}
                    w = "100%"
                    fontFamily="Work sans"
                    display="flex"
                    justifyContent={{base:'space-between'}}
                    alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat?(
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
            ):(
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                    fetchMessages={fetchMessages}
                  />
                </>
            )}
          </Text>
          <Box
  d="flex"
  flexDir="column"
  justifyContent="flex-end"
  p={3}
  bg="#E8E8E8"
  w="100%"
  h="100%"
  borderRadius="lg"
  overflowY="hidden"
  position="relative" // Add position relative
>
  <div style={{ flex: 1, overflowY: "auto", marginBottom: "50px" }}> {/* Add marginBottom to accommodate the form */}
    {loading ? (
      <div>Loading..</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <ScrollableChat messages={messages} />
      </div>
    )}
  </div>
  <FormControl
    onKeyDown={sendMessage}
    isRequired
    mt={3}
    id="first-name"
    position="absolute" // Add position absolute
    bottom={0} // Stick to the bottom
    left={0} // Align to the left
    right={0} // Align to the right
    bg="white" // Optional: Set background color for form
  >
    {isTyping ? (
      <div>
        <Lottie
          options={defaultOptions}
          width={70}
          style={{ marginBottom: 15, marginLeft: 0 }}
        />
      </div>
    ) : (
      <></>
    )}
    <Input
      variant="filled"
      bg="#E0E0E0"
      placeholder="Enter a message...."
      value={newMessage}
      onChange={typingHandler}
    />
  </FormControl>
</Box>

          </>
      ):(
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  )
}

export default SingleChat
