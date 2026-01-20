import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { authorized: false, error: 'Unauthorized' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        return { authorized: false, error: 'Forbidden: Admin access required' };
    }

    return { authorized: true, supabase };
}

// GET - Fetch all contact queries
export async function GET(request: NextRequest) {
    try {
        const { authorized, error, supabase } = await verifyAdmin();
        if (!authorized || !supabase) {
            return NextResponse.json({ success: false, error }, { status: authorized === false && error === 'Unauthorized' ? 401 : 403 });
        }

        const { data, error: dbError } = await supabase
            .from('contact_queries')
            .select('*')
            .order('created_at', { ascending: false });

        if (dbError) {
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// PATCH - Update contact status or notes
export async function PATCH(request: NextRequest) {
    try {
        const { authorized, error, supabase } = await verifyAdmin();
        if (!authorized || !supabase) {
            return NextResponse.json({ success: false, error }, { status: authorized === false && error === 'Unauthorized' ? 401 : 403 });
        }

        const { id, status, admin_notes, replied_at } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Contact ID required' }, { status: 400 });
        }

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
        if (replied_at !== undefined) updateData.replied_at = replied_at;

        const { error: dbError } = await supabase
            .from('contact_queries')
            .update(updateData)
            .eq('id', id);

        if (dbError) {
            console.error('Error updating contact:', dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// DELETE - Delete a contact
export async function DELETE(request: NextRequest) {
    try {
        const { authorized, error, supabase } = await verifyAdmin();
        if (!authorized || !supabase) {
            return NextResponse.json({ success: false, error }, { status: authorized === false && error === 'Unauthorized' ? 401 : 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Contact ID required' }, { status: 400 });
        }

        const { error: dbError } = await supabase
            .from('contact_queries')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error('Error deleting contact:', dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
