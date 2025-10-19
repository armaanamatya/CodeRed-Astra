import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';

// Notion API client
const NOTION_API_URL = 'https://api.notion.com/v1';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's Notion token from the request
    const { searchParams } = new URL(request.url);
    const notionToken = searchParams.get('token') || process.env.NOTION_TOKEN;
    const databaseId = searchParams.get('databaseId') || process.env.NOTION_CALENDAR_DATABASE_ID;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If no database ID is provided, try to get user's databases
    if (!databaseId) {
      try {
        // Get user's databases to show available options
        const databasesResponse = await fetch(`${NOTION_API_URL}/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            filter: {
              property: 'object',
              value: 'database'
            }
          })
        });

        if (databasesResponse.ok) {
          const databasesData = await databasesResponse.json();
          return NextResponse.json({
            success: false,
            error: 'No specific database selected',
            message: 'Please select a database from the list below',
            availableDatabases: databasesData.results.map((db: Record<string, unknown>) => ({
              id: db.id,
              title: (db.title as Array<{text: {content: string}}>)?.[0]?.text?.content || 'Untitled Database',
              url: db.url
            }))
          });
        }
      } catch (error) {
        console.error('Error fetching databases:', error);
      }

      return NextResponse.json(
        { 
          error: 'No database specified',
          message: 'Please provide a database ID or select from available databases',
          help: 'You can get the database ID from your Notion database URL (the 32-character string)'
        },
        { status: 400 }
      );
    }

    // Build filter for date range if provided
    let filter: Record<string, unknown> | undefined = undefined;
    if (startDate || endDate) {
      filter = {
        and: []
      };

      if (startDate) {
        filter.and.push({
          property: 'Date', // Adjust property name as needed
          date: {
            on_or_after: startDate
          }
        });
      }

      if (endDate) {
        filter.and.push({
          property: 'Date', // Adjust property name as needed
          date: {
            on_or_before: endDate
          }
        });
      }
    }

    console.log('Querying Notion database:', {
      databaseId,
      filter,
      tokenLength: notionToken?.length
    });

    // Query Notion database
    const response = await fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter,
        sorts: [
          {
            property: 'Date', // Adjust property name as needed
            direction: 'ascending'
          }
        ]
      })
    });

    console.log('Notion API Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Notion pages to calendar events format
    const events = data.results.map((page: Record<string, unknown>) => {
      const properties = page.properties;
      
      return {
        id: page.id,
        title: properties.Title?.title?.[0]?.text?.content || properties.Name?.title?.[0]?.text?.content || 'Untitled',
        description: properties.Description?.rich_text?.[0]?.text?.content || '',
        start: properties.Date?.date?.start || properties.Start?.date?.start,
        end: properties.Date?.date?.end || properties.End?.date?.end,
        allDay: properties.AllDay?.checkbox || false,
        location: properties.Location?.rich_text?.[0]?.text?.content || '',
        attendees: properties.Attendees?.people || [],
        status: properties.Status?.select?.name || 'Not Started',
        url: page.url,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time
      };
    });

    console.log('Notion API Response:', {
      databaseId,
      totalResults: data.results.length,
      events: events.length,
      sampleEvent: events[0] || 'No events',
      rawResults: data.results.slice(0, 2) // Show first 2 raw results for debugging
    });

    return NextResponse.json({
      success: true,
      events,
      database: {
        id: databaseId,
        title: 'Notion Calendar Database'
      }
    });

  } catch (error) {
    console.error('Notion Calendar API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Notion calendar events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    // Use user's OAuth token or fallback to environment token for development
    const notionToken = user?.notionToken || process.env.NOTION_TOKEN;

    if (!notionToken) {
      return NextResponse.json(
        { error: 'Notion workspace not connected. Please sign in with Notion first.' },
        { status: 401 }
      );
    }

    const { 
      databaseId, 
      title, 
      description, 
      startDate, 
      endDate, 
      allDay = false,
      location,
      attendees = []
    } = await request.json();

    if (!databaseId || !title || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: databaseId, title, startDate' },
        { status: 400 }
      );
    }

    // Create new page in Notion database
    const response = await fetch(`${NOTION_API_URL}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId
        },
        properties: {
          Title: {
            title: [
              {
                text: {
                  content: title
                }
              }
            ]
          },
          Date: {
            date: {
              start: startDate,
              end: endDate || undefined
            }
          },
          ...(description && {
            Description: {
              rich_text: [
                {
                  text: {
                    content: description
                  }
                }
              ]
            }
          }),
          ...(location && {
            Location: {
              rich_text: [
                {
                  text: {
                    content: location
                  }
                }
              ]
            }
          }),
          ...(attendees.length > 0 && {
            Attendees: {
              people: attendees.map((email: string) => ({ email }))
            }
          }),
          AllDay: {
            checkbox: allDay
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      event: {
        id: data.id,
        title,
        description,
        start: startDate,
        end: endDate,
        allDay,
        location,
        attendees,
        url: data.url
      }
    });

  } catch (error) {
    console.error('Notion Calendar create event error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create Notion calendar event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
