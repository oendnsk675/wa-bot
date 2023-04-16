const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@adiwajshing/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const { Configuration, OpenAIApi } = require("openai");
let setting = require("./key.json");
const mysql = require('mysql2');

const groupWL = ['OsLab', 'Sodara seperjuangan IT20', 'Teknologi Informasi 2020', 'smpppppp']
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wa_openai'
});

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('mysql has connected as id ' + connection.threadId);
});

let openai_key = ""

function addApiKey(m) {
  let msg = `Terimakasih sudah berkontribusi, semoga kamu sehat kawan😃`
  m.reply(msg)
}

function updateApiKey(key){
  return new Promise((resolve, reject) => {
    // lakukan query select pada tabel api_keys
    connection.query(`UPDATE api SET active = 0 WHERE apikey = '${key}'`, (err, results, fields) => {
      if (err) {
        // reject promise jika terjadi error
        reject(err);
      } else {
        // resolve promise dengan hasil query
        resolve(results);
      }
    });
  });
}

function getApikey() {
  return new Promise((resolve, reject) => {
    // lakukan query select pada tabel api_keys
    connection.query('SELECT * FROM api WHERE active = 1 LIMIT 1', (err, results, fields) => {
      if (err) {
        // reject promise jika terjadi error
        reject(err);
      } else {
        // resolve promise dengan hasil query
        resolve(results);
      }
    });
  });
}

getApikey()
  .then(results => {
    openai_key = results[0].apikey
  })
  .catch(err => console.error(err));

let logic = async (m, command, prefix, text, isCmd2, client, from, groupMetadata, body, budy, argsLog, color) => {
  try {
    if (isCmd2) {
      switch (command) {
        case "welcome":
          let msg_welcome = `😃Thankyou Osi, sudah tweak repository sansekai, bot ini dibuat oleh sansekai, aku tweak sedikit untuk keperluan temen-temen ku,untuk membuat bot ini terus berjalan, teman-teman bisa bantu dengan tambah api key, cara nambah api key bisa lihat disini ya: https://s.id/1F5bh
untuk melihat apa aja menu di bot ini ketik : */menu*`
          m.reply(msg_welcome)
          break;
        case "all":
          let members = groupMetadata.participants;
          let mentions = [];
          let items = [];

          members.forEach(({id, admin}) => {
            mentions.push(id)
            items.push(`@${id.split('@')[0]}`)
          });
          
          client.sendMessage(m.key.remoteJid, {
            text: items.join(" "), 
            mentions
          });

          
          break;
        case "tambah":
          addApiKey(m)
          break;
        case "menu":
          let msg_banner = `*Whatsapp Bot OpenAI*
            
*(ChatGPT)*
Cmd: ${prefix}si 
Tanyakan apa saja kepada AI. 

*(DALL-E)*
Cmd: ${prefix}img
Membuat gambar dari teks

*Note*
jangan lupa sumbang api keynya ya supaya tidak kena limit, untuk tutorial cara sumbang api key 
bisa lihat disini: https://s.id/1F5bh
`
          m.reply(msg_banner)
          break;
        case "si": case "openai": 
          try {
            if (openai_key === undefined) return reply(`Api key sudah kena limit semua, please dukung bot ini dengan tambah api key, cara nambah api key bisa lihat disini : https://s.id/1F5bh`);
            if (!text) return reply(`Chat dengan AI.\n\nContoh:\n${prefix}${command} Apa itu resesi`);
            const configuration = new Configuration({
              apiKey: openai_key+"sa",
            });
            const openai = new OpenAIApi(configuration);
  
            /*const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: text,
                temperature: 0, // Higher values means the model will take more risks.
                max_tokens: 2048, // The maximum number of tokens to generate in the completion. Most models have a context length of 2048 tokens (except for the newest models, which support 4096).
                top_p: 1, // alternative to sampling with temperature, called nucleus sampling
                frequency_penalty: 0.3, // Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
                presence_penalty: 0 // Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
            });
            m.reply(`${response.data.choices[0].text}`);*/
            m.reply('Tunggu ya.. lagi di proses, jika bot lama kemungkinan textnya panjang')
            const response = await openai.createChatCompletion({
              model: "gpt-3.5-turbo",
              messages: [{role: "user", content: text}],
            });
            await m.reply(`${response.data.choices[0].message.content}`);
  
          } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
            console.log(`${error.response.status}\n\n${error.response.data}`);
            if(error.response.status == 429){
              // update dan read api key
              updateApiKey(openai_key)
                .then(() => {
                  getApikey()
                    .then(results => {
                      openai_key = results[0].key
                      logic(m, command, prefix, text, isCmd2)
                      // return
                    })
                    .catch(err => console.error(err));
                })
                .catch(err => console.error(err))
              
            }else if (error.response.status == 429){
              updateApiKey(openai_key)
                .then(() => {
                  getApikey()
                    .then(results => {
                      openai_key = results[0].key
                      logic(m, command, prefix, text, isCmd2)
                      // return
                    })
                    .catch(err => console.error(err));
                })
                .catch(err => console.error(err))
            }
          } else {
            console.log(error.response);
            m.reply("Maaf, sepertinya ada yang error :"+ error.message);
          }
        }
          break;
        case "img": case "ai-img": case "image": case "images":
          try {
            if (openai_key === undefined) return reply(`Api key sudah kena limit semua, please dukung bot ini dengan tambah api key, cara nambah api key bisa lihat disini : https://s.id/1F5bh`);
            if (!text) return reply(`Membuat gambar dari AI.\n\nContoh:\n${prefix}${command} Wooden house on snow mountain`);
            const configuration = new Configuration({
              apiKey: openai_key,
            });
            const openai = new OpenAIApi(configuration);
            const response = await openai.createImage({
              prompt: text,
              n: 1,
              size: "512x512",
            });
            //console.log(response.data.data[0].url)
            client.sendImage(from, response.data.data[0].url, text, mek);
            } catch (error) {
              if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
                console.log(`${error.response.status}\n\n${error.response.data}`);
                if(error.response.status == 429){
                // update dan read api key
                updateApiKey(openai_key)
                  .then(() => {
                    getApikey()
                      .then(results => {
                        openai_key = results[0].key
                        logic(m, command, prefix, text, isCmd2)
                        // return
                      })
                      .catch(err => console.error(err));
                  })
                  .catch(err => console.error(err))
                
              }
              } else {
                console.log(error);
                m.reply("Maaf, sepertinya ada yang error :"+ error.message);
              }
            }
          break;
        default: {
          if (isCmd2 && body.toLowerCase() != undefined) {
            if (m.chat.endsWith("broadcast")) return;
            if (m.isBaileys) return;
            if (!budy.toLowerCase()) return;
            if (argsLog || (isCmd2 && !m.isGroup)) {
              // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            } else if (argsLog || (isCmd2 && m.isGroup)) {
              // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("tidak tersedia", "turquoise"));
            }
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
    // m.reply(util.format(err));
  }
}

module.exports = sansekai = async (client, m, chatUpdate, store) => {
  try {
    var body =
      m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype == "imageMessage"
        ? m.message.imageMessage.caption
        : m.mtype == "videoMessage"
        ? m.message.videoMessage.caption
        : m.mtype == "extendedTextMessage"
        ? m.message.extendedTextMessage.text
        : m.mtype == "buttonsResponseMessage"
        ? m.message.buttonsResponseMessage.selectedButtonId
        : m.mtype == "listResponseMessage"
        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
        : m.mtype == "templateButtonReplyMessage"
        ? m.message.templateButtonReplyMessage.selectedId
        : m.mtype === "messageContextInfo"
        ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text
        : "";
    var budy = typeof m.text == "string" ? m.text : "";
    // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
    var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/";
    const isCmd2 = body.startsWith(prefix);
    const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const itsMe = m.sender == botNumber ? true : false;
    let text = (q = args.join(" "));
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

    const from = m.chat;
    const reply = m.reply;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    // Group
    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => {}) : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";

    // const mentions = [];
    // const items = [];

    // members.forEach(({id, admin}) => {
    //   mentions.push(id);
    //   items.push(`@${id.slice}`)
    // });

    // console.log(ggg.participants);

    // m.reply("@Diriku ")

    // client.generateProfilePicture('6285951593544@c.us').then(profile => {
    //   console.log(profile.eurl);
    // }).catch(err => {
    //   console.error(err);
    // });
    
    
    // Push Message To Console
    let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;

    if (isCmd2 && !m.isGroup) {
      console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
    } else if (isCmd2 && m.isGroup) {
      if (!groupWL.includes(groupName)) {
        return 
      }
      console.log(
        chalk.black(chalk.bgWhite("[ LOGS ]")),
        color(argsLog, "turquoise"),
        chalk.magenta("From"),
        chalk.green(pushname),
        chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`),
        chalk.blueBright("IN"),
        chalk.green(groupName)
      );
    }

    logic(m, command, prefix, text, isCmd2, client, from, groupMetadata, body,budy, argsLog, color)
  } catch (err) {
    console.log(err);
    // m.reply(util.format(err));
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
