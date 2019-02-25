import { Command, flags } from '@oclif/command'
import cli from 'cli-ux'
import { Repository } from 'nodegit'
import { JiraClient } from './jiraClient'
import { GitHubClient } from './githubClient'

class GithubJiraPr extends Command {
  static description = 'Create GitHub PRs from JIRA tickets'

  static flags = {
    "help": flags.help({ char: 'h' }),
    "base-branch": flags.string({ required: true, char: 'b', description: 'base branch for PR', default: 'master' }),
    "ticket-id": flags.string({ required: true, char: 't', description: 'jira ticket ID' }),
    "jira-host": flags.string({ description: 'custom host for jira (i.e. mycompany.atlassian.net)' }),
    "jira-email": flags.string({ required: true, description: 'email address associated with jira' }),
    "jira-access-token": flags.string({ required: true, description: 'jira access token' }),
    "github-access-token": flags.string({ required: true, description: 'github access token' }),
    "pr-title": flags.string({ required: false, description: 'custom PR title' })
  }

  async run() {
    const params = this.collectParams()

    let jiraClient = new JiraClient({
      username: params.jiraUser,
      accessToken: params.jiraAccessToken,
      host: params.jiraHost
    })

    cli.action.start('Fetching JIRA ticket')
    const jiraTicket = await jiraClient.getJiraTicket(params.jiraTicketId)
    cli.action.stop('done')

    this.makePullRequest(params, jiraTicket)
  }

  private async makePullRequest(params: any, jiraTicket: any) {
    let githubClient = new GitHubClient(params.githubAccessToken)

    var baseBranch = params.baseBranch
    var prTitle = params.prTitle || jiraTicket.fields.summary

    cli.action.start('Making pull request')
    const result = await githubClient.openPullRequest({
      repo: await Repository.open("."),
      title: `[${jiraTicket.key}] ${prTitle}`,
      description: this.createPRDescription(params.jiraHost, jiraTicket),
      base: baseBranch
    })
    cli.action.stop('done')

    this.log(result.html_url)
  }

  private collectParams() {
    const {flags} = this.parse(GithubJiraPr)
    const baseBranch = flags["base-branch"]
    const jiraHost = flags["jira-host"] || 'jira.atlassian.com'
    const jiraTicketId = flags["ticket-id"]
    const jiraUser = flags["jira-email"]
    const jiraAccessToken = flags["jira-access-token"]
    const githubAccessToken = flags["github-access-token"]
    const prTitle = flags["pr-title"] || null;

    return {
      baseBranch: baseBranch,
      jiraHost: jiraHost,
      jiraTicketId: jiraTicketId,
      jiraUser: jiraUser,
      jiraAccessToken: jiraAccessToken,
      githubAccessToken: githubAccessToken,
      prTitle: prTitle
    }
  }

  private createPRDescription(jiraHost: string, jiraTicket: any) {
    return `https://${jiraHost}/browse/${jiraTicket.key}`
  }
}

export = GithubJiraPr
