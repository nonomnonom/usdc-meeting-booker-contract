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
      const cal = await getCalApi({"namespace":"life-advice"})
      
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
            fid: userFid || null  // Keep null initially. Only update if we have a valid FID.
          }

          try {
            // First check if booking exists, AND require a valid FID.
            const { data: existingBooking, error: checkError } = await supabase
              .from('cal_bookings')
              .select('*')
              .eq('booking_id', bookingData.booking_id)
              .not('fid', 'is', null) // IMPORTANT: Check for existing bookings with a valid FID.
              .single();


            if (checkError && checkError.code !== 'PGRST116') {
              console.error('Error checking existing booking:', checkError);
              return;
            }

            let finalBooking;

             if (existingBooking) {
              //If booking exists WITH fid, we do nothing.  It's already correct.
              finalBooking = existingBooking;

            } else {
                //If there's no existing booking with a valid FID,  then EITHER:
                // 1.  There's NO booking with that ID at all.
                // 2.  There IS a booking with that ID, but it has a NULL FID.
                // In either case, we proceed ONLY if we have a userFid.
                if (userFid) {
                    //Try to update an existing record (in case one exists without a FID)
                    const { data: updatedBooking, error: updateError } = await supabase
                        .from('cal_bookings')
                        .update({ ...bookingData, fid: userFid }) // Set the FID.
                        .eq('booking_id', bookingData.booking_id)
                        .select()
                        .single();

                    if (updateError && updateError.code !== 'PGRST116') { // Check for error OTHER than "no rows updated"
                        console.error('Error updating booking:', updateError);
                        return;
                    }


                    if (updatedBooking) {
                        //Update was successful
                        finalBooking = updatedBooking;
                    } else {
                        //No record was updated, so create a new one.  (This is the original insert).
                        const { data: newBooking, error: insertError } = await supabase
                            .from('cal_bookings')
                            .insert([{ ...bookingData, fid: userFid }]) // Set FID on insert
                            .select()
                            .single();

                        if (insertError) {
                            console.error('Error creating booking:', insertError);
                            return;
                        }
                        finalBooking = newBooking;
                    }
                } else {
                    // We don't have a userFid, so don't do anything.
                    console.warn("Booking created without FID.  Skipping Supabase operation.");
                    return;
                }
            }
            
            // Send notification only if we have FID and it's a new or updated booking
            if (userFid && finalBooking) {
              try {
                const notificationData = {
                  fid: userFid,
                  notificationId: `booking:${bookingData.booking_id}:${Date.now()}`,
                  title: "Booking Confirmed! 📅",
                  body: `Your booking with ${bookingData.organizer_name} for ${new Date(bookingData.start_time).toLocaleDateString()} is confirmed.`,
                  targetUrl: `${process.env.NEXT_PUBLIC_URL}/schedule?booking=${bookingData.booking_id}`,
                  priority: "high" as const
                };

                const response = await fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'X-Skip-Rate-Limit': 'true'
                  },
                  body: JSON.stringify(notificationData)
                });

                if (!response.ok) {
                  throw new Error('Failed to send notification: ' + await response.text());
                }

                console.log('Booking notification sent successfully');
              } catch (notifError) {
                console.error('Failed to send booking notification:', notifError);
              }
            }
          } catch (error) {
            console.error('Error in booking operation:', error)
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
        namespace="life-advice"
        calLink="0fjake/life-advice-frame"
        style={{width:"100%", height:"100%", overflow:"scroll"}}
        config={{
          layout: "month_view"
        }}
      />
    </div>
  )
}