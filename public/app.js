const socket = io();
const user = localStorage.getItem("user");
let current = "";

socket.emit("join", user);

// carregar usuários
fetch("/users")
.then(r=>r.json())
.then(users=>{
 userList.innerHTML="";
 users.forEach(u=>{
  if(u.username===user) return;
  const div=document.createElement("div");
  div.innerText=u.username;
  div.onclick=()=>loadChat(u.username);
  userList.appendChild(div);
 });
});

function loadChat(other){
 current=other;

 fetch(`/messages/${user}/${other}`)
 .then(r=>r.json())
 .then(msgs=>{
  messages.innerHTML="";
  msgs.forEach(addMsg);
 });
}

msg.addEventListener("keypress",e=>{
 if(e.key==="Enter") send();
});

async function send(){
 if(!msg.value||!current) return;

 socket.emit("privateMessage",{
  from:user,
  to:current,
  text:msg.value,
  file:null
 });

 msg.value="";
}

// upload
file.onchange=async ()=>{
 const form=new FormData();
 form.append("file",file.files[0]);

 const res=await fetch("/upload",{method:"POST",body:form});
 const data=await res.json();

 socket.emit("privateMessage",{
  from:user,
  to:current,
  text:"",
  file:data.file
 });
};

socket.on("privateMessage",data=>{
 if(data.from===current||data.to===current){
  addMsg(data);
 }
});

function addMsg(m){
 const div=document.createElement("div");

 if(m.file){
  div.innerHTML=`${m.from}: <a href="${m.file}" target="_blank">Arquivo</a>`;
 } else {
  div.innerText=`${m.from}: ${m.text}`;
 }

 messages.appendChild(div);
}