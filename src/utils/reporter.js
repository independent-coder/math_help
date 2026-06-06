/**
 * Utility to send reports to Discord via Webhook
 */

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1508625698200490138/gOFnC8ezj7PKqVFaI9oqLZaDQuO57a35Sf2WARWKafajTHZKY-e_JGuUrL5_J9t8LUIg";

export const sendReport = async (item, issueType, details = "", currentSeason = null, currentEpisode = null, extraData = {}) => {
  const browserInfo = navigator.userAgent;
  const resolution = `${window.screen.width}x${window.screen.height}`;
  
  const fields = [
    {
      name: "Content Info",
      value: `**Type:** ${item.media_type === 'tv' ? 'TV Series' : 'Movie'}\n**Year:** ${item['#YEAR']}\n**TMDB ID:** ${item.tmdb_id}\n**IMDb ID:** ${item['#IMDB_ID']}`,
      inline: true
    },
    {
      name: "Environment",
      value: `**Browser:** ${browserInfo.substring(0, 100)}...\n**Resolution:** ${resolution}${extraData.provider ? `\n**Provider:** ${extraData.provider}` : ""}`,
      inline: true
    },
    {
      name: "Issue Details",
      value: `**Problem:** ${issueType}${details ? `\n**User Message:** ${details}` : ""}`,
      inline: false
    }
  ];

  // Add season/episode info if applicable
  if (item.media_type === 'tv' && currentSeason) {
    fields[0].value += `\n**Reported At:** S${currentSeason} E${currentEpisode}`;
  }

  // Add Player URL if provided
  if (extraData.playerUrl) {
    fields.push({
      name: "Player URL",
      value: `\`${extraData.playerUrl}\``,
      inline: false
    });
  }

  const payload = {
    embeds: [
      {
        title: `🚩 New Issue Reported: ${item['#TITLE']}`,
        color: 15158332, // Red
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: "NetCore Reporter"
        }
      }
    ]
  };

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send report to Discord:', error);
    return false;
  }
};
