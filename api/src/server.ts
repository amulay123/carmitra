import { createApp } from "./app"
import { config } from "./config"

createApp().listen(config.port, () => {
  console.log(`Carmitra API listening on port ${config.port}`)
  if (!config.whatsappToken) console.log("WHATSAPP_TOKEN is not set: chats are recorded but owners get no WhatsApp alert.")
})
