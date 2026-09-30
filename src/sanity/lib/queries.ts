export const authScreenQuery = `*[_type == "authScreen" && _id == "authScreen"][0]{
  kicker,
  title,
  body,
  points,
  signUpLabel,
  signInLabel,
  browseLabel,
  footnote
}`;

export const platformContentQuery = `{
  "settings": *[_type == "platformSettings" && _id == "platformSettings"][0]{
    title,
    tagline,
    footerNote
  },
  "applets": *[_type == "applet"] | order(sortOrder asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    icon,
    description,
    kind,
    status
  },
  "locations": *[_type == "weatherLocation"] | order(sortOrder asc, name asc) {
    "id": _id,
    name,
    state,
    country,
    latitude,
    longitude,
    isDefault
  },
  "tickers": *[_type == "stockTicker"] | order(sortOrder asc, symbol asc) {
    "id": _id,
    symbol,
    name,
    isDefault
  },
  "teams": *[_type == "sportsTeam"] | order(sortOrder asc, name asc) {
    "id": _id,
    name,
    abbreviation,
    league,
    isDefault
  }
}`;
