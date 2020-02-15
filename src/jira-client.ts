import axios from 'axios'

export class JiraClient {
  username: string
  accessToken: string
  host: string

  constructor(config: any) {
    this.username = config.username
    this.accessToken = config.accessToken
    this.host = config.host
  }

  async getJiraTicket(ticketId: string) {
    const response = await axios({
      url: `https://${this.host}/rest/api/latest/issue/${ticketId}`,
      auth: {
        username: this.username,
        password: this.accessToken
      }
    })
    return response.data
  }
}