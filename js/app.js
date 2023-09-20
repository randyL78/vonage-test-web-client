
// replace these values with those generated in your Video API account

const BASE_URL = 'https://randy.ngrok.dev/api/'
let global_session_id;

axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

// Handling all of our errors here by alerting them
const handleError = (error) => {
  if (error) {
    alert(error.message);
  }
}

const createSession = async () => {
  let session;
  await axios.post(`${BASE_URL}open_tok_sessions`)
    .then(response => response.data)
    .then(data => { session = data.session })

  console.log(session)

  return session;
}

const createToken = async (session_id) => {
  return await axios.post(`${BASE_URL}open_tok_tokens`, {
    session_id,
  })
    .then(response => response.data)
    .then(data => data.token)
}

const getOrCreateSessionId = async () => {
  let sessions = await axios.get(`${BASE_URL}open_tok_sessions`)
    .then(response => response.data)

  return sessions.length > 0 ? sessions[0] : createSession()
}

const initializeSession = async (session_id, api_key) => {
  const token = await createToken(session_id);

  const session = OT.initSession(api_key, session_id);

  // Subscribe to a newly created stream
  session.on('streamCreated', function(event) {
    session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    }, handleError);
  });

  // Create a publisher
  const publisher = OT.initPublisher('publisher', {
    insertMode: 'append',
    width: '100%',
    height: '100%'
  }, handleError);

  // Connect to the session
  session.connect(token, function(error) {
    // If the connection is successful, publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);
    }
  });
}

const dialOut = async (session_id) => {
  return await axios.post(`${BASE_URL}phone_calls`, {
    session_id,
  })
    .then(response => response.data)
}

const disconnectAll = () => {
  axios.delete(`${BASE_URL}conversations/${global_session_id}`, { headers: {'Content-Type' : 'application/x-www-form-urlencoded'}})
}

const main = async () => {
  const { session_id, api_key } = await getOrCreateSessionId();
  global_session_id = session_id

  await initializeSession(session_id, api_key)
  const call = await dialOut(session_id);
  console.log(call)
}

main();

