import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { getNotionMCPClient } from '@/lib/notion-mcp';

export async function GET(request: NextRequest) {
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
    
    if (!user?.notionToken) {
      return NextResponse.json(
        { error: 'Notion workspace not connected. Please connect your Notion account first.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get('databaseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!databaseId) {
      return NextResponse.json(
        { 
          error: 'Database ID is required',
          message: 'Please provide a database ID to fetch events'
        },
        { status: 400 }
      );
    }

    // Connect to Notion API and fetch events
    const mcpClient = getNotionMCPClient();
    await mcpClient.connect(user.notionToken);

    try {
      // Build filter for date range if provided
      interface DateFilter {
        property: string;
        date: {
          on_or_after?: string;
          on_or_before?: string;
        };
      }

      interface QueryFilter {
        and?: DateFilter[];
      }

      const filterArray: DateFilter[] = [];
      
      if (startDate) {
        filterArray.push({
          property: 'Date',
          date: {
            on_or_after: startDate
          }
        });
      }

      if (endDate) {
        filterArray.push({
          property: 'Date',
          date: {
            on_or_before: endDate
          }
        });
      }

      const filter: QueryFilter = filterArray.length > 0 ? { and: filterArray } : {};

      // Query the database
      interface NotionPage {
        id: string;
        properties: Record<string, unknown>;
      }

      const results = await mcpClient.queryDatabase(databaseId, filter);
      
      // Transform results to calendar events format
      const events = results.map((page: NotionPage) => {
        const properties = page.properties || {};
        
        return {
          id: page.id,
          title: properties.Title?.title?.[0]?.text?.content || 
                 properties.Name?.title?.[0]?.text?.content || 
                 'Untitled',
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

      await mcpClient.disconnect();

      return NextResponse.json({
        success: true,
        events,
        database: {
          id: databaseId,
          title: 'Notion Calendar Database'
        }
      });

    } catch (apiError) {
      await mcpClient.disconnect();
      throw apiError;
    }

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
    
    if (!user?.notionToken) {
      return NextResponse.json(
        { error: 'Notion workspace not connected. Please connect your Notion account first.' },
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

    // Connect to Notion API and create event
    const mcpClient = getNotionMCPClient();
    await mcpClient.connect(user.notionToken);

    try {
      // Prepare properties for the new page
      interface PropertyValue {
        [key: string]: unknown;
      }

      interface NotionPageProperties {
        Title: PropertyValue;
        Date: PropertyValue;
        AllDay: PropertyValue;
        Description?: PropertyValue;
        Location?: PropertyValue;
      }

      const properties: NotionPageProperties = {
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
        AllDay: {
          checkbox: allDay
        }
      };

      if (description) {
        properties.Description = {
          rich_text: [
            {
              text: {
                content: description
              }
            }
          ]
        };
      }

      if (location) {
        properties.Location = {
          rich_text: [
            {
              text: {
                content: location
              }
            }
          ]
        };
      }

      if (attendees.length > 0) {
        properties.Attendees = {
          people: attendees.map((email: string) => ({ email }))
        };
      }

      // Create the page
      const result = await mcpClient.createPage(databaseId, properties);
      await mcpClient.disconnect();

      return NextResponse.json({
        success: true,
        event: {
          id: result.id,
          title,
          description,
          start: startDate,
          end: endDate,
          allDay,
          location,
          attendees,
          url: result.url
        }
      });

    } catch (apiError) {
      await mcpClient.disconnect();
      throw apiError;
    }

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
