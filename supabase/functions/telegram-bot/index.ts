import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts"

// Initialize bot with your token
const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN") || "")

// Basic command handlers
bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to the Sacred Tree of Life Bot! Use /tree to access the main menu.")
})

bot.command("tree", async (ctx) => {
  const mainMenuKeyboard = {
    inline_keyboard: [
      [
        { text: "🌳 Tree of Life Reading", callback_data: "menu_tree" },
        { text: "🔮 Numerology Reading", callback_data: "menu_num" }
      ],
      [
        { text: "🎨 ASCII Art Converter", callback_data: "menu_ascii" },
        { text: "🎵 Frequency Healing", callback_data: "menu_vibe" }
      ],
      [
        { text: "ℹ️ About", callback_data: "menu_about" },
        { text: "❓ Help", callback_data: "menu_help" }
      ]
    ]
  }

  const welcomeMessage = 
    "🌟 Welcome to the Sacred Tree of Life Bot! 🌟\n\n" +
    "I am your spiritual companion on a journey of self-discovery and healing.\n\n" +
    "Choose from these sacred tools:\n" +
    "🌳 Tree of Life Reading - Discover your Celtic tree personality\n" +
    "🔮 Numerology Reading - Uncover your life path and destiny numbers\n" +
    "🎨 ASCII Art Converter - Transform images into spiritual ASCII art\n" +
    "🎵 Frequency Healing - Find your healing frequency\n\n" +
    "Select an option below to begin your journey:"

  await ctx.reply(welcomeMessage, {
    reply_markup: mainMenuKeyboard
  })
})

// Handle callback queries
bot.on("callback_query", async (ctx) => {
  const query = ctx.callbackQuery.data

  switch (query) {
    case "menu_tree":
      await ctx.reply(
        "🌳 Welcome to the Sacred Tree of Life Personality Bot! 🌳\n" +
        "Please reply to this message with your birthday in DD/MM format (e.g., 25/12 for December 25th)"
      )
      break

    case "menu_num":
      await ctx.reply(
        "🔮 Welcome to the Numerology Calculator! 🔮\n\n" +
        "Please use one of these formats:\n" +
        "1. Full reading: DD/MM/YYYY, Full Name or Username\n" +
        "2. Life Path only: DD/MM/YYYY\n" +
        "3. Destiny only: Your Full Name or Username\n" +
        "Examples:\n" +
        "25/12/1990, Andy Chad Ayrey\n" +
        "25/12/1990\n" +
        "Andy Chad Ayrey\n\n" +
        "🔒 For privacy, your response will be deleted immediately after processing."
      )
      break

    case "menu_ascii":
      const settings = {
        width: 200,
        contrast: 1.0,
        brightness: 1.0,
        color_mode: "true_color"
      }

      const asciiMenuKeyboard = {
        inline_keyboard: [
          [
            { text: "Width +", callback_data: "ascii_width_up" },
            { text: settings.width.toString(), callback_data: "ascii_width_info" },
            { text: "Width -", callback_data: "ascii_width_down" }
          ],
          [
            { text: "Contrast +", callback_data: "ascii_contrast_up" },
            { text: settings.contrast.toFixed(1), callback_data: "ascii_contrast_info" },
            { text: "Contrast -", callback_data: "ascii_contrast_down" }
          ],
          [
            { text: "Brightness +", callback_data: "ascii_brightness_up" },
            { text: settings.brightness.toFixed(1), callback_data: "ascii_brightness_info" },
            { text: "Brightness -", callback_data: "ascii_brightness_down" }
          ],
          [
            { text: `Color Mode: ${settings.color_mode}`, callback_data: "ascii_color_mode" }
          ],
          [
            { text: "Reset Settings", callback_data: "ascii_reset" }
          ],
          [
            { text: "🏠 Main Menu", callback_data: "return_main" }
          ]
        ]
      }

      const asciiMessage = 
        "🎨 ASCII Art Converter Settings 🎨\n\n" +
        "Current Settings:\n" +
        `• Width: ${settings.width} pixels (Affects detail level)\n` +
        `• Contrast: ${settings.contrast.toFixed(1)}\n` +
        `• Brightness: ${settings.brightness.toFixed(1)}\n` +
        `• Color Mode: ${settings.color_mode}\n\n` +
        "Send me any image to convert it with these settings! 📸"

      await ctx.reply(asciiMessage, {
        reply_markup: asciiMenuKeyboard
      })
      break

    // Add other menu handlers...
  }

  // Answer the callback query to remove the loading state
  await ctx.answerCallbackQuery()
})

// Create and serve the webhook handler
const handleUpdate = webhookCallback(bot, "std/http")

serve(async (req) => {
  if (req.method === "POST") {
    try {
      return await handleUpdate(req)
    } catch (err) {
      console.error(err)
      return new Response("Error processing update", { status: 500 })
    }
  }
  return new Response("Expected a POST request", { status: 400 })
}) 