const { isJidGroup } = require('@whiskeysockets/baileys');
const path = require("path"); // ✅ FIX: you forgot to import path
const config = require('../config');

const getContextInfo = (jid) => {
    return {
        mentionedJid: [jid],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363420646690174@newsletter',
            newsletterName: 'ᴊꜰx ᴍᴅ-xᴠ3',
            serverMessageId: 143,
        },
    };
};

// ✅ Verified Contact
const getVerifiedContact = () => {
    return {
        key: {
            fromMe: false,
            participant: `0@s.whatsapp.net`,
            remoteJid: "status@broadcast"
        },
        message: {
            contactMessage: {
                displayName: "ᴊꜰx ᴍᴅ-xᴠ3",
                vcard: "BEGIN:VCARD\nVERSION:3.0\nFN:ᴊᴇᴘʜᴛᴇʀ ᴛᴇᴄʜ\nORG:ᴊꜰx ᴍᴅ-xᴠ3;\nTEL;type=CELL;type=VOICE;waid=93775551335:+2349046157539\nEND:VCARD"
            }
        }
    };
};

// ✅ Default profile pictures (array instead of broken object)
const defaultProfilePictures = [
    path.join(__dirname, "../src/menu4.jpg"),
    path.join(__dirname, "../src/menu3.jpg"),
    path.join(__dirname, "../src/menu2.jpg"),
];

const getProfilePicture = async (conn, jid) => {
    try {
        return await conn.profilePictureUrl(jid, 'image');
    } catch {
        // return random fallback image
        return defaultProfilePictures[
            Math.floor(Math.random() * defaultProfilePictures.length)
        ];
    }
};

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants || [];
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;
        const timestamp = new Date().toLocaleString();
        const verifiedContact = getVerifiedContact();

        for (const num of participants) {
            const userName = num.split("@")[0];
            const ppUrl = await getProfilePicture(conn, num).catch(
                async () => await getProfilePicture(conn, update.id)
            );

            if (update.action === "add" && config.WELCOME === "true") {
                const WelcomeText = `Hey @${userName} 👋\n` +
                    `> Welcome to *${metadata.subject}*.\n` +
                    `> You are member number ${groupMembersCount} in this group. 😏\n` +
                    `> Please read the group description to avoid being removed:\n` +
                    `${desc}\n` +
                    `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊꜰx*.`;  

                await conn.sendMessage(update.id, { 
                    image: { url: ppUrl },  
                    caption: WelcomeText,
                    mentions: [num],
                    contextInfo: getContextInfo(num)
                }, { quoted: verifiedContact });

            } else if (update.action === "remove" && config.WELCOME === "true") {
                const GoodbyeText = `> Goodbye @${userName}. 😔\n` +
                    `> Another member has left the group.\n` +
                    `> Time left: *${timestamp}*\n` +
                    `> The group now has ${groupMembersCount} members. 😭`;

                await conn.sendMessage(update.id, { 
                    image: { url: ppUrl },  
                    caption: GoodbyeText,
                    mentions: [num],
                    contextInfo: getContextInfo(num)
                }, { quoted: verifiedContact });

            } else if (update.action === "demote" && config.ADMIN_EVENTS === "true") {
                const demoter = update.author.split("@")[0];
                const status = `*Admin Event*\n\n` +
                      `@${demoter} has demoted @${userName} from admin. 👀😬\n` +
                      `Time: ${timestamp}\n` +
                      `*Group:* ${metadata.subject}`;

                await conn.sendMessage(update.id, {
                    text: status,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo(update.author)
                }, { quoted: verifiedContact });

            } else if (update.action === "promote" && config.ADMIN_EVENTS === "true") {
                const promoter = update.author.split("@")[0];
                const status = `*Admin Event*\n\n` +
                      `@${promoter} has promoted @${userName} to admin. 🎉\n` +
                      `Time: ${timestamp}\n` +
                      `*Group:* ${metadata.subject}`;

                await conn.sendMessage(update.id, {
                    text: status,
                    mentions: [update.author, num],
                    contextInfo: getContextInfo(update.author)
                }, { quoted: verifiedContact });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
