/** Hardcoded profile for the app's single current user. Extend this object as
 * more profile-driven UI (summary page, profile page, etc.) needs it.
 * `dob` is stored as "DDMMYYYY". */
export const PROFILE = {
  user: {
    name: 'rohit',
    fullName: 'rohit rajuji ghawale',
    code: 'code.to.polymath',
    email: 'code.to.polymath@gmail.com',
    portfolio: 'https://codetopolymath.github.io/portfolio/',
    dob: '15091999',
  },
} as const
