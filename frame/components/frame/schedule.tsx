'use client'

import Cal, { getCalApi } from "@calcom/embed-react"
import { useEffect, useState } from "react"
import sdk from "@farcaster/frame-sdk"
import { supabase } from "@/lib/db/supbase"

export default function CalBooking() {
  const [userFid, setUserFid] = useState<number | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      const context = await sdk.context;
      if (context.user?.fid) {
        setUserFid(context.user.fid);
      }
    };
    initializeSDK();
  }, []);

  useEffect(() => {
    (async function() {
      const cal = await getCalApi({"namespace":"test"})
      
      cal("ui", {
        "hideEventTypeDetails": false,
        "layout": "month_view"
      })
      
      cal("on", {
        action: "bookingSuccessful",
        callback: async (e: CustomEvent<any>) => {
          // Log full event for debugging
          console.log('Booking event:', e.detail)

          // Extract booking data based on the actual structure
          const bookingData = {
            // Event details
            event_type: e.detail.data.eventType?.title || '',
            start_time: e.detail.data.date, // This contains the start time
            duration: e.detail.data.duration,
            
            // Host/Organizer details
            organizer_name: e.detail.data.organizer?.name || '',
            organizer_email: e.detail.data.organizer?.email || '',
            organizer_timezone: e.detail.data.organizer?.timeZone || '',
            
            // Primary attendee (booker)
            name: e.detail.data.booking?.attendees?.[0]?.name || '',
            email: e.detail.data.booking?.attendees?.[0]?.email || '',
            
            // Additional attendees (guests)
            guests: e.detail.data.booking?.attendees?.slice(1).map((attendee: any) => ({
              name: attendee.name,
              email: attendee.email
            })) || [],
            
            // Additional information
            additional_notes: e.detail.data.booking?.description || '',
            location: e.detail.data.booking?.location || '',
            status: 'pending', // Set initial status as pending
            
            // Metadata
            booking_id: e.detail.data.booking?.uid || '',
            created_at: new Date().toISOString(),
            
            // Add Farcaster FID if available
            fid: userFid || null
          }

          try {
            // Save to Supabase
            const { data, error } = await supabase
              .from('cal_bookings')
              .insert([bookingData])

            if (error) {
              console.error('Error saving to Supabase:', error)
            } else {
              console.log('Successfully saved to Supabase:', data)
              
              // Send notification if we have FID
              if (userFid) {
                try {
                  const formattedDate = new Date(bookingData.start_time).toLocaleDateString();
                  const formattedTime = new Date(bookingData.start_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'X-Skip-Rate-Limit': 'true'
                    },
                    body: JSON.stringify({
                      fid: userFid,
                      notificationId: `booking:${bookingData.booking_id}`,
                      title: "Booking Created! 📅",
                      body: `Your booking for ${formattedDate} at ${formattedTime} has been created. Payment is required to confirm.`,
                      priority: "high"
                    })
                  });
                } catch (notifError) {
                  // Log error but don't block the booking process
                  console.error('Failed to send notification:', notifError);
                }
              }
            }
          } catch (error) {
            console.error('Error in Supabase operation:', error)
          }
        },
      })

      // Monitor all events for debugging
      cal("on", {
        action: "*",
        callback: (e: CustomEvent<any>) => {
          console.log('Cal.com event:', e.detail.type, e.detail)
        }
      })
    })()
  }, [userFid])

  return (
    <div className="w-full h-[calc(100vh-4rem)] pb-16">
      <Cal 
        namespace="test"
        calLink="nouns-playground-b66zci/test"
        style={{width:"100%", height:"100%", overflow:"scroll"}}
        config={{
          layout: "month_view"
        }}
      />
    </div>
  )
}