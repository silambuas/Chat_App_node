const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

const autoScroll = () =>
{
	//New message element
	const $newMessage = $messages.lastElementChild

	//Height of new message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	//Visible Height
	const visibleHeight = $messages.offsetHeight

	//Height of messages container
	const containerHeight = $messages.scrollHeight

	//How far to scroll
	const scrollOffset = $messages.scrollTop + visibleHeight

	if ((containerHeight - newMessageHeight)<= scrollOffset)
	{
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on("locationMessage", (url) =>
{
	console.log(url);
	const html = Mustache.render(locationTemplate, {
		url: url.url,
		username: url.username,
		createdAt: moment(url.createdAt).format("h:mm a"),
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll()
});

socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		users,
		room
	})
	document.querySelector('#sidebar').innerHTML = html
})

socket.on("message", (message) => {
	console.log(message);
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format("h:mm a"),
	});
	$messages.insertAdjacentHTML("beforeend", html);
	autoScroll()
});

$messageForm.addEventListener("submit", (e) => {
	e.preventDefault();

	//disable
	$messageFormButton.setAttribute("disabled", "disabled");

	const message = e.target.elements.message.value;

	socket.emit("sendMessage", message, (error) => {
		//enable
		$messageFormButton.removeAttribute("disabled");
		$messageFormInput.value = "";
		$messageFormInput.focus();

		if (error) return console.log(error);
		console.log("This message was delivered");
	});
});

$sendLocationButton.addEventListener("click", () => {
	if (!navigator.geolocation) {
		return alert("This browser doesn't support geolocation");
	}
	$sendLocationButton.setAttribute("disabled", "disabled");

	navigator.geolocation.getCurrentPosition((position) => {
		const { latitude, longitude } = position.coords;
		socket.emit("sendLocation", { latitude, longitude }, (message) => {
			console.log(message);
			$sendLocationButton.removeAttribute("disabled");
		});
	});
});

socket.emit("join", { username, room }, (error) => {
	if (error)
	{
		alert(error)
		location.href = '/'
	}
});
