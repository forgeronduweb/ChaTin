const REPO_OWNER = 'forgeronduweb';
const REPO_NAME = 'ChaTin';
const ASSET_NAME = 'chatin.apk';

function getHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN must be set to publish GitHub releases.');
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// Publishes a new GitHub Release with the APK attached as `chatin.apk`, so
// the landing page's fixed `.../releases/latest/download/chatin.apk` link
// always resolves to whatever was last published here. Each call creates a
// brand new release (unique tag) rather than reusing one, since GitHub's
// "latest" alias is based on publish recency, not tag name.
export async function publishGithubRelease(
  buffer: Buffer,
  version: string,
  notes: string | null,
): Promise<void> {
  const headers = getHeaders();

  const createRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: `v${version}-${Date.now()}`,
      name: `v${version}`,
      body: notes ?? '',
      draft: false,
      prerelease: false,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`GitHub release creation failed (${createRes.status}): ${await createRes.text()}`);
  }
  const release = (await createRes.json()) as { upload_url: string };

  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${ASSET_NAME}`);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/vnd.android.package-archive',
    },
    body: new Blob([new Uint8Array(buffer)]),
  });
  if (!uploadRes.ok) {
    throw new Error(`GitHub asset upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
  }
}
