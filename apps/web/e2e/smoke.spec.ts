import {
  expect,
  type APIRequestContext,
  type Page,
  test,
} from "@playwright/test";

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type APITrack = {
  id: string;
  title: string;
  cover_url: string;
};

const testRunId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function fetchTracks(request: APIRequestContext) {
  const response = await request.get("/api/v1/tracks?limit=10&offset=0");
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as { tracks: APITrack[] };
  expect(body.tracks.length).toBeGreaterThanOrEqual(2);

  return body.tracks;
}

async function createUserSession(request: APIRequestContext, page: Page) {
  const email = `kims-e2e-${testRunId}@example.com`;
  const password = `KimsE2E-${testRunId}!`;

  const response = await request.post("/api/v1/auth/register", {
    data: {
      name: "KIMS E2E",
      email,
      password,
    },
  });
  expect(response.ok()).toBeTruthy();

  const auth = (await response.json()) as AuthResponse;

  await page.addInitScript((session: AuthResponse) => {
    window.localStorage.setItem(
      "kims-auth-access-token",
      session.access_token,
    );
    window.localStorage.setItem(
      "kims-auth-refresh-token",
      session.refresh_token,
    );
    window.localStorage.setItem("kims-auth-user", JSON.stringify(session.user));
  }, auth);

  return { auth, email, password };
}

function trackRow(page: Page, title: string) {
  return page.getByRole("row", { name: `Select ${title}` });
}

test("register and login pages authenticate a new user", async ({ page }) => {
  const email = `kims-e2e-ui-${testRunId}@example.com`;
  const password = `KimsE2EUi-${testRunId}!`;

  await page.goto("/register");
  await page.getByLabel("Full Name").fill("KIMS E2E UI");
  await page.getByLabel("Email").fill(email);
  await page
    .getByRole("textbox", { exact: true, name: "Password" })
    .fill(password);
  await page
    .getByRole("textbox", { exact: true, name: "Confirm Password" })
    .fill(password);
  await page
    .getByLabel("Accept Terms of Service and Privacy Policy")
    .focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Create Account" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("KIMS E2E UI")).toBeVisible();

  await page.evaluate(() => {
    window.localStorage.removeItem("kims-auth-access-token");
    window.localStorage.removeItem("kims-auth-refresh-token");
    window.localStorage.removeItem("kims-auth-user");
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page
    .getByRole("textbox", { exact: true, name: "Password" })
    .fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("KIMS E2E UI")).toBeVisible();
});

test("public catalog loads and track switching updates the player", async ({
  page,
  request,
}) => {
  const tracks = await fetchTracks(request);
  const [firstTrack, secondTrack] = tracks;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Top Hits" })).toBeVisible();
  await expect(trackRow(page, firstTrack.title)).toBeVisible();
  await expect(trackRow(page, secondTrack.title)).toBeVisible();

  await trackRow(page, firstTrack.title)
    .getByRole("button", { name: `Play ${firstTrack.title}` })
    .click();
  await expect(
    page.getByRole("contentinfo", { name: "Music player" }),
  ).toContainText(firstTrack.title);

  await trackRow(page, secondTrack.title)
    .getByRole("button", { name: `Play ${secondTrack.title}` })
    .click();
  await expect(
    page.getByRole("contentinfo", { name: "Music player" }),
  ).toContainText(secondTrack.title);
});

test("authenticated library smoke covers favorites, playlists, and history", async ({
  page,
  request,
}) => {
  const tracks = await fetchTracks(request);
  const [track] = tracks;
  const { auth } = await createUserSession(request, page);

  const favoriteResponse = await request.post("/api/v1/favorites", {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    data: { track_id: track.id },
  });
  expect(favoriteResponse.ok()).toBeTruthy();

  await page.goto("/favorites");
  await expect(trackRow(page, track.title)).toBeVisible();

  await trackRow(page, track.title)
    .getByRole("button", { name: `Favorite ${track.title}` })
    .click();
  await expect(trackRow(page, track.title)).toHaveCount(0);

  const playlistResponse = await request.post("/api/v1/playlists", {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    data: { name: `E2E Playlist ${testRunId}` },
  });
  expect(playlistResponse.ok()).toBeTruthy();
  const playlist = (await playlistResponse.json()) as {
    id: string;
    name: string;
  };

  const addTrackResponse = await request.post(
    `/api/v1/playlists/${playlist.id}/tracks`,
    {
      headers: { Authorization: `Bearer ${auth.access_token}` },
      data: { track_id: track.id },
    },
  );
  expect(addTrackResponse.ok()).toBeTruthy();

  await page.goto(`/playlists/${playlist.id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: playlist.name }),
  ).toBeVisible();
  await expect(trackRow(page, track.title)).toBeVisible();
  await expect
    .poll(async () => {
      return page.locator("img").evaluateAll((images, expectedCoverURL) => {
        const encodedCoverURL = encodeURIComponent(expectedCoverURL);

        return images.some((image) => {
          const src = image.getAttribute("src") ?? "";
          return (
            src.includes(expectedCoverURL) ||
            src.includes(encodedCoverURL)
          );
        });
      }, track.cover_url);
    })
    .toBe(true);

  await trackRow(page, track.title)
    .getByRole("button", { name: `Remove ${track.title} from playlist` })
    .click();
  await expect(trackRow(page, track.title)).toHaveCount(0);

  const historyResponse = await request.post("/api/v1/history", {
    headers: { Authorization: `Bearer ${auth.access_token}` },
    data: { track_id: track.id },
  });
  expect(historyResponse.ok()).toBeTruthy();

  await page.goto("/history");
  await expect(page.getByText(track.title).first()).toBeVisible();

  await page
    .getByRole("button", { name: `Remove ${track.title} from history` })
    .click();
  await expect(page.getByText(track.title).first()).toHaveCount(0);
});

test("forgot password request moves to OTP step without exposing account state", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(`kims-e2e-${testRunId}@example.com`);
  await page.getByRole("button", { name: "Send Reset Code" }).click();

  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
});
