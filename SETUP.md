# Quick Setup Guide

This guide will help you get the Sales Support System running locally in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally
- Google Cloud account with Sheets API access

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

### Database URL
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/salesdb"
```

### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```
Then add to `.env`:
```env
NEXTAUTH_SECRET="your_generated_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### Google Sheets Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google Sheets API"
4. Create Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Download JSON key file
5. Share your Google Sheet with the service account email from the JSON
6. Copy the spreadsheet ID from the URL (e.g., `docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/...`)
7. Add to `.env`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID="your_spreadsheet_id"
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...entire JSON as single line..."}'
```

## Step 3: Setup Database

Create the PostgreSQL database:

```bash
createdb salesdb
```

Or using psql:
```sql
CREATE DATABASE salesdb;
```

Run migrations:
```bash
npx prisma generate
npx prisma migrate deploy
```

Seed initial users:
```bash
npm run db:seed
```

This creates:
- **Admin**: `admin@example.com` / `Admin@123`
- **Sales**: `sales@example.com` / `Sales@123`

## Step 4: Prepare Google Sheet

Your Google Sheet must have a tab named **"Price List"** with these columns (in order):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Brand | Model | Image | Variant | MRP | MOP | Sellout from date | Sellout To Date | Last Updated | Quick Pitch | Bank Offers | Upgrade / Exchange Offers | Store Offers and Gifts | Weekly Focus | All Models | New Launch |

**Important:**
- Columns N, O, P (Weekly Focus, All Models, New Launch) should be **checkboxes**
- Data starts from row 2 (row 1 is header)

### Example Data

```
Brand: Samsung
Model: S25 Ultra
Image: https://example.com/image.jpg
Variant: 12/256
MRP: 129999
MOP: 119999
Quick Pitch: Latest flagship with AI features
Bank Offers: 10% cashback on HDFC cards
Weekly Focus: ✓ (checked)
New Launch: ✓ (checked)
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Login

Use the seeded credentials:

**Admin Account:**
- Email: `admin@example.com`
- Password: `Admin@123`

**Sales Account:**
- Email: `sales@example.com`
- Password: `Sales@123`

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Ensure database exists: `psql -l | grep salesdb`

### "Google Sheets API error"
- Verify service account has access to the sheet
- Check credentials JSON is valid
- Ensure sheet name is exactly "Price List"
- Verify Sheets API is enabled in Google Cloud

### "Build fails"
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### "No products showing"
- Check Google Sheets has data in row 2+
- Verify sheet columns match expected order
- Check browser console for errors
- Try refreshing cache from Admin Panel

## Next Steps

1. Add real product data to your Google Sheet
2. Invite team members (create users via Admin Panel)
3. Customize branding if needed
4. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production

## Development Tips

### Hot Reload
The dev server has hot reload enabled. Changes to code will auto-refresh.

### Database Changes
After modifying `prisma/schema.prisma`:
```bash
npx prisma migrate dev --name your_migration_name
npx prisma generate
```

### View Database
```bash
npx prisma studio
```
Opens a GUI at http://localhost:5555

### Test Production Build
```bash
npm run build
npm start
```

### Check Lint
```bash
npm run lint
```

## Support

- See [README.md](./README.md) for full documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- See [SECURITY.md](./SECURITY.md) for security guidelines

Happy coding! 🚀
