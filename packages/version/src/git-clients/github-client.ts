import { execSync } from '@lerna-lite/core';
import { Octokit } from '@octokit/rest';
import { SyncOptions } from 'execa';
import parseGitUrl from 'git-url-parse';
import log from 'npmlog';

export async function createGitHubClient() {
  log.silly('createGitHubClient', '');

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;
  const options: { auth?: string; baseUrl?: string } = {};

  if (GH_TOKEN) {
    options.auth = `token ${GH_TOKEN}`;
  }

  if (GHE_VERSION) {
    const { enterpriseServer36, enterpriseServer37, enterpriseServer38, enterpriseServer39 } = await import(
      `@octokit/plugin-enterprise-server`
    );

    if (GHE_VERSION !== '3.6' && GHE_VERSION !== '3.7' && GHE_VERSION !== '3.8' && GHE_VERSION !== '3.9') {
      throw new Error(`GitHub Enterprise Server v${GHE_VERSION} is not supported.`);
    }

    const plugins = {
      '3.6': enterpriseServer36,
      '3.7': enterpriseServer37,
      '3.8': enterpriseServer38,
      '3.9': enterpriseServer39,
    };

    Octokit.plugin(plugins[GHE_VERSION]);
  }

  if (GHE_API_URL) {
    options.baseUrl = GHE_API_URL;
  }

  return new Octokit(options);
}

export function parseGitRepo(remote = 'origin', opts?: SyncOptions<string>): parseGitUrl.GitUrl {
  log.silly('parseGitRepo', '');
  const args = ['config', '--get', `remote.${remote}.url`];
  log.verbose('git', args.join(' '));
  const url = execSync('git', args, opts);

  if (!url) {
    throw new Error(`Git remote URL could not be found using "${remote}".`);
  }

  return parseGitUrl(url);
}
