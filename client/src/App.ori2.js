import React, { useState, useEffect, useRef } from 'react';
import {
  Navbar,
  NavbarBrand,
  UncontrolledTooltip
} from 'reactstrap';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { EditorState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import Avatar from 'react-avatar';

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import './App.css';

function App() {
  const [appState, setAppState] = useState({
    currentUsers: [],
    userActivity: [],
    username: null,
    text: ''
  });
  const [editorState, setEditorState] = useState(
    () => EditorState.createEmpty(),
  );
  const [isLogin, setIsLogin] = useState(false);
  const { sendJsonMessage } = useWebSocket('ws://127.0.0.1:8000', {
    onOpen: () => {
      console.log('WebSocket connection established');
    },
    onMessage: (message) => {
      const dataFromServer = JSON.parse(message.data);
      const stateToChange = {};
      if (dataFromServer.type === "userevent") {
        stateToChange.currentUsers = Object.values(dataFromServer.data.users);
      } else if (dataFromServer.type === "contentchange") {
        stateToChange.text = dataFromServer.data.editorContent || 'test';
      }
      stateToChange.userActivity = dataFromServer.data.userActivity;
      setAppState(stateToChange);
    }
  });

  function logInUser() {
    const username = appState.username.value;
    if(!username.trim()) {
      return;
    }
    setIsLogin(true);
    sendJsonMessage({
      username,
      type: 'userevent'
    });
  }


  function LoginSection() {
    return (
      <div className="account">
        <div className="account__wrapper">
          <div className="account__card">
            <div className="account__profile">
              <p className="account__name">Hello, user!</p>
              <p className="account__sub">Join to edit the document</p>
            </div>
            <input name="username" ref={(input) => { appState.username = input; }} className="form-control" />
            <button type="button" onClick={() => logInUser()} className="btn btn-primary account__btn">Join</button>
          </div>
        </div>
      </div>
    );
  }

  function EditorSection() {
    return (
      <div className="main-content">
        <div className="document-holder">
          <div className="currentusers">
            {appState.currentUsers.map(user => (
              <div key={user.username}>
                <span id={user.username} className="userInfo" key={user.username}>
                  <Avatar name={user.username} size={40} round="20px"/>
                </span>
                <UncontrolledTooltip placement="top" target={user.username}>
                  {user.username}
                </UncontrolledTooltip>
              </div>
            ))}
          </div>
          <Editor
            editorState={editorState}
            onEditorStateChange={setEditorState}
          />
        </div>
        <div className="history-holder">
          <ul>
            {appState.userActivity.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
          </ul>
        </div>
      </div>
      );
  }

  return (
    <>
      <Navbar color="light" light>
        <NavbarBrand href="/">Real-time document editor</NavbarBrand>
      </Navbar>
      <div className="container-fluid">
        {isLogin ? <EditorSection/> : <LoginSection/> }
      </div>
    </>
  );
}

export default App;
