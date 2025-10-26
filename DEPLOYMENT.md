# Deployment Guide - IWatches

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database seeded with initial reviews
- [ ] Premium catalog PDF in `/public/premium.pdf`
- [ ] Updated catalog download URL in `CatalogDownload.tsx`
- [ ] Updated WhatsApp number in `ContactSection.tsx`
- [ ] Resend domain verified or using default
- [ ] Google OAuth credentials (if using)

## Vercel Deployment

### Step 1: Connect Repository

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository

### Step 2: Configure Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```bash
TURSO_CONNECTION_URL=libsql://[your-db].turso.io
TURSO_AUTH_TOKEN=[your-token]
BETTER_AUTH_SECRET=[random-32-char-string]
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=[another-random-string]
RESEND_API_KEY=re_[your-key]
RESEND_FROM=IWatches <your@domain.com>
```

Optional:
```bash
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Step 3: Update OAuth Redirect URIs

If using Google OAuth:

1. Go to Google Cloud Console
2. Add authorized redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployed site

### Step 5: Post-Deployment

1. Test catalog download
2. Test authentication flow
3. Test referral system
4. Verify email sending works
5. Check all forms submit correctly

## Environment Variable Details

### TURSO_CONNECTION_URL & TURSO_AUTH_TOKEN
Already provided in `.env` file. Copy these to Vercel.

### BETTER_AUTH_SECRET
Generate with:
```bash
openssl rand -base64 32
```

### NEXTAUTH_URL
**CRITICAL**: Must match your deployed domain exactly.
- Development: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`

### NEXTAUTH_SECRET
Another random string. Generate same way as BETTER_AUTH_SECRET.

### RESEND_API_KEY
1. Sign up at resend.com
2. Get API key from dashboard
3. For production, verify your domain
4. Or use default `onboarding@resend.dev` for testing

### RESEND_FROM
Format: `Name <email@domain.com>`
- Must be a verified domain in Resend
- Or use `onboarding@resend.dev` for testing

### GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized JavaScript origins:
   - `https://your-domain.vercel.app`
4. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`

## Database Migration

Database is already set up with Turso. Tables created:
- downloads
- referrals  
- reviews
- leads
- user (auth)
- session (auth)
- account (auth)
- verification (auth)

To seed reviews in production (optional):
```bash
npx tsx src/db/seeds/reviews.ts
```

## Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS records as instructed
3. Update `NEXTAUTH_URL` environment variable
4. Update Google OAuth redirect URIs

## Monitoring

Check these after deployment:

- [ ] Homepage loads correctly
- [ ] Catalog download works
- [ ] Email capture modal appears
- [ ] Contact form sends emails
- [ ] Newsletter signup works
- [ ] Sign up creates account
- [ ] Sign in authenticates
- [ ] Mi cuenta shows referral code
- [ ] Referral tracking works
- [ ] Premium catalog unlocks at 3 referrals
- [ ] Reviews carousel displays
- [ ] Review submission works
- [ ] All images load
- [ ] Mobile responsive
- [ ] SEO metadata present

## Troubleshooting

### Auth Not Working
- Check `NEXTAUTH_URL` matches deployed domain exactly
- Check `BETTER_AUTH_SECRET` is set
- Clear browser cookies and try again

### Emails Not Sending
- Verify Resend API key is correct
- Check Resend dashboard for logs
- Verify sender email is correct format

### Database Errors
- Check Turso credentials are correct
- Verify tables exist in Turso dashboard
- Check database URL format

### Referrals Not Tracking
- Check download API route is accessible
- Verify referral code format
- Check anti-abuse window (2 hours)

### Images Not Loading
- Check Unsplash URLs are accessible
- Verify next/image configuration
- Check network tab for errors

## Security Notes

- Never commit `.env` to git (already in `.gitignore`)
- Rotate secrets regularly
- Use environment-specific credentials
- Enable Vercel's security features
- Monitor Turso usage limits

## Performance Tips

- Enable Vercel Analytics
- Monitor Core Web Vitals
- Check Lighthouse scores
- Optimize images if needed
- Use Vercel's Edge Network

## Support

For deployment issues:
1. Check Vercel build logs
2. Check browser console
3. Check API route responses
4. Verify all environment variables

## Production Checklist

Before going live:

- [ ] All features tested
- [ ] Mobile tested on real devices
- [ ] Forms submit correctly
- [ ] Emails sending
- [ ] Auth working
- [ ] SEO metadata correct
- [ ] Analytics installed (optional)
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Backup strategy in place
- [ ] Monitoring set up

## Post-Launch

- Monitor error rates
- Check email deliverability
- Track conversion rates
- Review user feedback
- Optimize based on analytics
- Plan feature updates

---

🚀 Ready to deploy! Your luxury watch landing page will be live in minutes.
