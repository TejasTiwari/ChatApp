const socket= io()

const $messageForm= document.querySelector('#message-form')
const $messageFormInput= $messageForm.querySelector('input')
const $messageFormButton= $messageForm.querySelector('button')
const $locationButton= document.querySelector('#send-location')
const $messages= document.querySelector('#messages')

const messageTemplate= document.querySelector('#message-template').innerHTML
const locationTemplate= document.querySelector('#location-template').innerHTML
const sidebarTemplate= document.querySelector('#sidebar-template').innerHTML

const {username, room}= Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll= ()=>{
    // new msg element
    const $newMessage= $messages.lastElementChild

    // height of new msg
    const newMessageStyles= getComputedStyle($newMessage)
    const newMessageMargin= parseInt(newMessageStyles.marginBottom)
    const newMessageHeight= $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight= $messages.offsetHeight

    //height of messages container
    const containerHeight= $messages.scrollHeight

    // how far scrolled
    const scrollOffset= $messages.scrollTop+ visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop= $messages.scrollHeight
    }
}

socket.on('message', (msg)=>{
    const html= Mustache.render(messageTemplate, {
        username: msg.username, 
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
    console.log(msg)
})

socket.on('locationMessage', (url)=>{
    console.log(url)
    const html= Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:m a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users})=>{
    const html= Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML= html
})
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    const msg= e.target.elements.message.value
    socket.emit('sendMessage', msg, (ack='Message delivered')=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value= ''
        $messageFormInput.focus()
        console.log(ack)
    })
})

$locationButton.addEventListener('click', ()=>{
    
    
    if(!navigator.geolocation){
        return alert('Location service not supported')
    }

    else{
        $locationButton.setAttribute('disabled', 'disabled')
        navigator.geolocation.getCurrentPosition((position)=>{
            console.log(position)

            socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, ()=>{
                console.log('Location sent successfully')
                $locationButton.removeAttribute('disabled')
            })
        })
    }
})

socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error)
        location.href= '/'
    }
})