I will implement the requested features (Song Requests, Programming Schedule, and Prayer Mural) with the following technical steps.

### User Features
1. **Song Request Form**: A validated form to request songs, with a button to send the request via WhatsApp to the radio's number.
2. **Programming Schedule**: A real-time display of the current show and a list of upcoming shows for the day.
3. **Prayer Mural**: A community wall where users can submit prayer requests and view approved ones.

### Technical Implementation
1. **Database**: Already created tables for `programming`, `song_requests`, and `prayer_requests` with RLS.
2. **Components**:
   - `SongRequestForm.tsx`: Uses `react-hook-form` and `zod` for validation.
   - `ScheduleDisplay.tsx`: Fetches and filters programming based on the current time.
   - `PrayerMural.tsx`: Displays a list of approved prayers and includes a submission form.
3. **Integration**: Integration with WhatsApp using a pre-filled message link.
4. **Admin**: Basic status management for requests (can be expanded later).

### Technical Details
- **WhatsApp Integration**: Using `https://wa.me/{number}?text={encoded_message}`.
- **Real-time**: Supabase `on` listeners for new prayer requests/comments if needed.
- **Validation**: Strict schemas for user input to prevent spam.

I'll start by creating the components and adding them to the portal.