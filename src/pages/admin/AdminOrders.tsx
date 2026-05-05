import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CopyButton from '@/components/admin/CopyButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { sendFamilySharingOrderNote } from '@/lib/familySharingNote';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, Save, Trash2, Plus, X, Search, Copy, Star, RefreshCw, Download } from 'lucide-react';
import { useExportFormat } from '@/components/admin/useExportFormat';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, formatDateTime, formatRelativeDate, getKathmanduNowLocal, kathmanduToUTC } from '@/lib/formatDate';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/admin/RichTextEditor';
import InputFieldRenderer, { type InputFieldDef, type FieldResponse } from '@/components/InputFieldRenderer';
import { sanitizeSearchInput, phoneMatches } from '@/lib/phoneSearch';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  on_hold: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-destructive/20 text-destructive',
  refunded: 'bg-red-500/20 text-red-400',
};

const selectClassName = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

interface EditItem {
  id: string;
  isNew?: boolean;
  product_id: string;
  variation_id: string;
  variation_name: string;
  price: number;
  quantity: number;
}

const AdminOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderNote, setOrderNote] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
   const [editItems, setEditItems] = useState<EditItem[]>([]);
   const [editManualSheetLink, setEditManualSheetLink] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [productSearch, setProductSearch] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Add order state
  const [addingOrder, setAddingOrder] = useState(true);
  const [newOrderDate, setNewOrderDate] = useState(getKathmanduNowLocal);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerError, setCustomerError] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newVariationId, setNewVariationId] = useState('');
  const [productPickerSearch, setProductPickerSearch] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('manual');
  
  const [newRemarks, setNewRemarks] = useState('');
  const [newManualSheetLink, setNewManualSheetLink] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newFieldValues, setNewFieldValues] = useState<Record<string, string | string[]>>({});

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles(name, email, phone), order_items(*, products(name))')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ['all-products-for-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, product_variations(id, name, price, has_special_input_fields)')
        .order('name');
      return data || [];
    },
  });

  const { data: orderNotes } = useQuery({
    queryKey: ['order-notes', selectedOrder?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', selectedOrder!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const { data: auditLog } = useQuery({
    queryKey: ['order-audit-log', selectedOrder?.id],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('order_audit_log')
        .select('*')
        .eq('order_id', selectedOrder!.id)
        .order('created_at', { ascending: false });
      if (!logs?.length) return [];
      const userIds = [...new Set(logs.map((l: any) => l.changed_by))];
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      return logs.map((l: any) => ({ ...l, profile: profMap.get(l.changed_by) }));
    },
    enabled: !!selectedOrder,
  });

  // Family-sharing template note for the products/variations in this order
  const { data: familySharingInfo } = useQuery({
    queryKey: ['family-sharing-info-for-order', selectedOrder?.id],
    queryFn: async () => {
      const items = (selectedOrder?.order_items || []) as any[];
      const variantIds = items.map((i) => i.variation_id).filter(Boolean);
      const productIds = items.map((i) => i.product_id).filter(Boolean);
      if (!variantIds.length && !productIds.length) return null;

      // Find family_sharing_products linked via variants OR product directly
      const [{ data: fsByVariant }, { data: fsByProduct }] = await Promise.all([
        variantIds.length
          ? supabase
              .from('family_sharing_product_variants')
              .select('family_product_id, variant_id, family_sharing_products(order_note_template, product_id)')
              .in('variant_id', variantIds)
          : Promise.resolve({ data: [] as any[] }),
        productIds.length
          ? supabase
              .from('family_sharing_products')
              .select('id, order_note_template, product_id')
              .in('product_id', productIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const templates = new Set<string>();
      (fsByVariant || []).forEach((r: any) => {
        const t = r.family_sharing_products?.order_note_template?.trim();
        if (t) templates.add(t);
      });
      (fsByProduct || []).forEach((r: any) => {
        const t = r.order_note_template?.trim();
        if (t) templates.add(t);
      });

      const isFamilySharing = (fsByVariant?.length ?? 0) > 0 || (fsByProduct?.length ?? 0) > 0;
      const templateList = Array.from(templates);

      // Fetch actual sent static-note rows for this order, matching by stripped-text
      // since the stored note is plain text while the template is HTML.
      let sentNotes: { note: string; created_at: string; senderEmail: string | null }[] = [];
      if (templateList.length > 0 && selectedOrder?.id) {
        const stripTags = (s: string) =>
          s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
           .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
        const templateTextSet = new Set(templateList.map(stripTags));

        const { data: notes } = await supabase
          .from('order_notes')
          .select('note, created_at, sent_by')
          .eq('order_id', selectedOrder.id)
          .order('created_at', { ascending: false });

        const matched = (notes || []).filter((n: any) => templateTextSet.has(stripTags(n.note || '')));
        const senderIds = [...new Set(matched.map((n: any) => n.sent_by).filter(Boolean))];
        let profMap = new Map<string, string>();
        if (senderIds.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, email')
            .in('user_id', senderIds);
          profMap = new Map((profs || []).map((p: any) => [p.user_id, p.email]));
        }
        sentNotes = matched.map((n: any) => ({
          note: n.note,
          created_at: n.created_at,
          senderEmail: profMap.get(n.sent_by) || null,
        }));
      }

      return { isFamilySharing, templates: templateList, sentNotes };
    },
    enabled: !!selectedOrder,
  });

  // Product-level notes for the products in this order (for quick-paste into customer note)
  const { data: productNotes } = useQuery({
    queryKey: ['product-notes-for-order', selectedOrder?.id],
    queryFn: async () => {
      const productIds = (selectedOrder?.order_items || [])
        .map((i: any) => i.product_id)
        .filter(Boolean);
      if (!productIds.length) return [];
      const { data } = await supabase
        .from('notes')
        .select('id, heading, description, product_id, products(name)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedOrder,
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, total, status, items, deletedItemIds, previousStatus, userId, refundAmount, manualSheetLink }: { id: string; total: number; status: string; items: EditItem[]; deletedItemIds: string[]; previousStatus: string; userId: string; refundAmount: number | null; manualSheetLink: boolean }) => {
      const { error: updateOrderErr } = await supabase.from('orders').update({ total, status: status as any, refund_amount: refundAmount, manual_sheet_link: manualSheetLink } as any).eq('id', id);
      if (updateOrderErr) throw updateOrderErr;

      if (deletedItemIds.length > 0) {
        await supabase.from('order_items').delete().in('id', deletedItemIds);
      }

      for (const item of items) {
        if (item.isNew) {
          await supabase.from('order_items').insert({
            order_id: id,
            product_id: item.product_id || null,
            variation_id: item.variation_id || null,
            variation_name: item.variation_name || null,
            price: item.price,
            quantity: item.quantity,
          });
        } else {
          await supabase.from('order_items').update({
            product_id: item.product_id || null,
            variation_id: item.variation_id || null,
            variation_name: item.variation_name || null,
            price: item.price,
            quantity: item.quantity,
          }).eq('id', item.id);
        }
      }

      // Cleanup expired assignments first to free credential slots
      if (status === 'completed' && previousStatus !== 'completed') {
        await supabase.rpc('cleanup_expired_assignments');
      }

      // Auto-assign credentials when status changes to completed
      if (status === 'completed' && previousStatus !== 'completed') {
        for (const item of items) {
          if (!item.variation_id) continue;
          const { data: links } = await supabase
            .from('credential_variant_links')
            .select('credential_id, priority')
            .eq('variant_id', item.variation_id)
            .order('priority');
          if (!links?.length) continue;

          for (const link of links) {
            const { data: existing } = await supabase
              .from('credential_assignments')
              .select('id')
              .eq('order_id', id)
              .eq('credential_id', link.credential_id)
              .eq('user_id', userId);
            if (existing && existing.length > 0) continue;

            const { data: cred } = await supabase
              .from('family_sharing_credentials')
              .select('assigned_count, max_limit')
              .eq('id', link.credential_id)
              .single();
            if (!cred || cred.assigned_count >= cred.max_limit) continue;

            const { data: variation } = await supabase
              .from('product_variations')
              .select('expiry_days')
              .eq('id', item.variation_id)
              .single();

            await supabase.from('credential_assignments').insert({
              credential_id: link.credential_id,
              order_id: id,
              user_id: userId,
              validity_days: variation?.expiry_days || null,
            });

            await supabase
              .from('family_sharing_credentials')
              .update({ assigned_count: (cred.assigned_count || 0) + 1 })
              .eq('id', link.credential_id);

            if (user) {
              await sendFamilySharingOrderNote({
                credentialId: link.credential_id,
                orderId: id,
                adminUserId: user.id,
              });
            }

            break;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setEditTotal(String(order.total));
    setEditStatus(order.status);
    setEditManualSheetLink(!!(order as any).manual_sheet_link);
    const existingRefund = (order as any).refund_amount;
    if (order.status === 'refunded' && existingRefund != null && Number(existingRefund) > 0 && Number(existingRefund) < Number(order.total)) {
      setRefundType('partial');
      setRefundAmount(String(existingRefund));
    } else {
      setRefundType('full');
      setRefundAmount('');
    }
    setDeletedItemIds([]);
    setEditItems(
      (order.order_items || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id || '',
        variation_id: item.variation_id || '',
        variation_name: item.variation_name || '',
        price: item.price,
        quantity: item.quantity,
      }))
    );
    setOrderNote('');
    setIsAdminOnly(false);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setSending(true);
    try {
      // Build a list of audit entries describing what changed
      const auditEntries: { action: string; details: string }[] = [];

      // Status change
      if (editStatus !== selectedOrder.status) {
        auditEntries.push({
          action: 'status_changed',
          details: `Status: ${selectedOrder.status} → ${editStatus}`,
        });
      }

      // Item changes (added / removed / variation or product changed)
      const originalItems: any[] = selectedOrder.order_items || [];
      const productNameById = new Map((products || []).map((p: any) => [p.id, p.name]));

      for (const orig of originalItems) {
        if (deletedItemIds.includes(orig.id)) {
          auditEntries.push({
            action: 'item_removed',
            details: `Removed: ${orig.products?.name || 'Item'}${orig.variation_name ? ` (${orig.variation_name})` : ''}`,
          });
          continue;
        }
        const updated = editItems.find(i => !i.isNew && i.id === orig.id);
        if (!updated) continue;
        if (updated.product_id !== (orig.product_id || '')) {
          auditEntries.push({
            action: 'product_changed',
            details: `Product: ${orig.products?.name || '—'} → ${productNameById.get(updated.product_id) || '—'}`,
          });
        }
        if (updated.variation_id !== (orig.variation_id || '') || updated.variation_name !== (orig.variation_name || '')) {
          auditEntries.push({
            action: 'variation_changed',
            details: `Variation: ${orig.variation_name || '—'} → ${updated.variation_name || '—'}`,
          });
        }
      }

      for (const newItem of editItems.filter(i => i.isNew)) {
        auditEntries.push({
          action: 'item_added',
          details: `Added: ${productNameById.get(newItem.product_id) || 'Item'}${newItem.variation_name ? ` (${newItem.variation_name})` : ''}`,
        });
      }

      const totalNum = parseFloat(editTotal) || selectedOrder.total;
      let refundAmt: number | null = null;
      if (editStatus === 'refunded') {
        if (refundType === 'partial') {
          const parsed = parseFloat(refundAmount);
          if (!parsed || parsed <= 0 || parsed > totalNum) {
            setSending(false);
            toast.error(`Enter a valid partial refund amount between 0 and ${totalNum}`);
            return;
          }
          refundAmt = parsed;
        } else {
          refundAmt = totalNum;
        }
      }

      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        total: totalNum,
        status: editStatus,
        items: editItems,
        deletedItemIds,
        previousStatus: selectedOrder.status,
        userId: selectedOrder.user_id,
        refundAmount: refundAmt,
        manualSheetLink: editManualSheetLink,
      });

      const noteSent = !!stripHtml(orderNote);
      if (noteSent) {
        await supabase.from('order_notes').insert({
          order_id: selectedOrder.id,
          note: orderNote,
          sent_by: user!.id,
          is_admin_only: isAdminOnly,
        } as any);
        auditEntries.push({
          action: 'note_sent',
          details: `Sent ${isAdminOnly ? 'admin-only ' : ''}note: ${stripHtml(orderNote)}`,
        });
      }

      // Persist audit entries
      if (auditEntries.length > 0 && user) {
        await supabase.from('order_audit_log').insert(
          auditEntries.map(e => ({
            order_id: selectedOrder.id,
            changed_by: user.id,
            action: e.action,
            details: e.details,
          }))
        );
        queryClient.invalidateQueries({ queryKey: ['order-audit-log', selectedOrder.id] });
      }

      // Send "Order Completed" email when admin marks the order as completed.
      if (
        editStatus === 'completed' &&
        selectedOrder.status !== 'completed'
      ) {
        try {
          const [{ data: profile }, { data: logoSetting }] = await Promise.all([
            supabase.from('profiles').select('email, phone').eq('user_id', selectedOrder.user_id).maybeSingle(),
            supabase.from('site_settings').select('value').eq('key', 'email_logo_url').maybeSingle(),
          ]);
          const productName = (editItems || [])
            .map(it => `${(products as any)?.find((p: any) => p.id === it.product_id)?.name || 'Item'}${it.variation_name ? ` - ${it.variation_name}` : ''}`)
            .join(', ');
          if (profile?.email) {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'order-completed',
                recipientEmail: profile.email,
                idempotencyKey: `order-completed-${selectedOrder.id}-${Date.now()}`,
                templateData: {
                  customerEmail: profile.email,
                  customerPhone: profile.phone || '',
                  productName,
                  orderId: selectedOrder.order_number,
                  amount: String(parseFloat(editTotal) || selectedOrder.total),
                  paymentMethod: (selectedOrder as any).payment_method
                    ? (selectedOrder as any).payment_method.charAt(0).toUpperCase() + (selectedOrder as any).payment_method.slice(1)
                    : '',
                  adminMessage: !isAdminOnly && stripHtml(orderNote) ? orderNote : '',
                  logoUrl: logoSetting?.value || '',
                },
              },
            });
          }
        } catch (emailErr) {
          console.error('Failed to send order-completed email:', emailErr);
        }
      }

      // Send "Order Note" email when admin adds a customer-visible note WITHOUT changing the order status.
      if (
        noteSent &&
        !isAdminOnly &&
        editStatus === selectedOrder.status
      ) {
        try {
          const [{ data: profile }, { data: logoSetting }] = await Promise.all([
            supabase.from('profiles').select('email, phone').eq('user_id', selectedOrder.user_id).maybeSingle(),
            supabase.from('site_settings').select('value').eq('key', 'email_logo_url').maybeSingle(),
          ]);
          const productName = (editItems || [])
            .map(it => `${(products as any)?.find((p: any) => p.id === it.product_id)?.name || 'Item'}${it.variation_name ? ` - ${it.variation_name}` : ''}`)
            .join(', ');
          if (profile?.email) {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'order-note',
                recipientEmail: profile.email,
                idempotencyKey: `order-note-${selectedOrder.id}-${Date.now()}`,
                templateData: {
                  customerEmail: profile.email,
                  customerPhone: profile.phone || '',
                  productName,
                  orderId: selectedOrder.order_number,
                  amount: String(parseFloat(editTotal) || selectedOrder.total),
                  paymentMethod: (selectedOrder as any).payment_method
                    ? (selectedOrder as any).payment_method.charAt(0).toUpperCase() + (selectedOrder as any).payment_method.slice(1)
                    : '',
                  adminMessage: orderNote,
                  logoUrl: logoSetting?.value || '',
                },
              },
            });
          }
        } catch (emailErr) {
          console.error('Failed to send order-note email:', emailErr);
        }
      }

      toast.success(`Order ${selectedOrder.order_number} Edited Successfully`);
      setSelectedOrder(null);
    } catch (err: any) {
      const msg = err?.message || '';
      toast.error(msg.includes('Family Sheet Limit is Full') ? msg : (msg || 'Failed to update order'));
    } finally {
      setSending(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    setEditItems(prev => prev.map((item, i) =>
      i === index ? { ...item, product_id: productId, variation_id: '', variation_name: '', price: product?.price || 0 } : item
    ));
  };

  const handleVariationChange = (index: number, variationId: string) => {
    const item = editItems[index];
    const product = products?.find((p: any) => p.id === item.product_id);
    const variation = (product as any)?.product_variations?.find((v: any) => v.id === variationId);
    if (variation) {
      setEditItems(prev => prev.map((it, i) =>
        i === index ? { ...it, variation_id: variationId, variation_name: variation.name, price: variation.price } : it
      ));
    }
  };

  const addItem = () => {
    setEditItems(prev => [...prev, { id: crypto.randomUUID(), isNew: true, product_id: '', variation_id: '', variation_name: '', price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const item = editItems[index];
    if (!item.isNew) setDeletedItemIds(prev => [...prev, item.id]);
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const getVariationsForProduct = (productId: string) => {
    const product = products?.find((p: any) => p.id === productId);
    return (product as any)?.product_variations || [];
  };

  // Customer search for add order
  const handleCustomerSearch = async (rawTerm: string) => {
    const term = sanitizeSearchInput(rawTerm);
    setCustomerSearch(term);
    setSelectedCustomer(null);
    setCustomerError('');
    if (term.trim().length < 2) { setCustomerResults([]); return; }
    setCustomerSearching(true);
    const searchTerm = term.trim().toLowerCase();
    const { data } = await supabase.from('profiles').select('user_id, name, email, phone');
    const filtered = (data || []).filter(p =>
      p.email?.toLowerCase().includes(searchTerm) || phoneMatches(p.phone, term)
    );
    setCustomerResults(filtered);
    if (filtered.length === 0) setCustomerError('Not registered yet');
    setCustomerSearching(false);
  };

  const openAddOrder = () => {
    setSelectedOrder(null);
    setAddingOrder(true);
    setNewOrderDate(getKathmanduNowLocal());
    setCustomerSearch('');
    setCustomerResults([]);
    setSelectedCustomer(null);
    setCustomerError('');
    setNewProductId('');
    setNewVariationId('');
    setNewAmount('');
    setNewPaymentMethod('manual');
    setNewRemarks('');
    setNewFieldValues({});
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer || !newProductId || !newAmount) return;
    setCreatingOrder(true);
    try {
      const product = products?.find((p: any) => p.id === newProductId);
      const variation = newVariationId ? (product as any)?.product_variations?.find((v: any) => v.id === newVariationId) : null;

      // Detect if variation is linked to a family-sharing product.
      // Family-sharing variants auto-complete; others stay in processing.
      let familyProductId: string | null = null;
      let familyOrderNoteTemplate = '';
      if (newVariationId) {
        const { data: fpv } = await supabase
          .from('family_sharing_product_variants')
          .select('family_product_id')
          .eq('variant_id', newVariationId)
          .maybeSingle();
        if (fpv?.family_product_id) {
          familyProductId = fpv.family_product_id;
          const { data: fp } = await supabase
            .from('family_sharing_products')
            .select('order_note_template')
            .eq('id', familyProductId)
            .maybeSingle();
          familyOrderNoteTemplate = (fp as any)?.order_note_template?.trim() || '';
        }
      }
      const isFamilySharing = !!familyProductId;

      // Final status:
      //  - family-sharing variant → completed
      //  - regular variant → processing + send only new-order email
      const finalStatus: 'processing' | 'completed' = isFamilySharing ? 'completed' : 'processing';

      // Pre-check: if variation is linked to a family sheet, ensure last manager group has free slot
      if (newVariationId && !newManualSheetLink) {
        const { data: links } = await supabase
          .from('sheet_variant_links')
          .select('sheet_id')
          .eq('variation_id', newVariationId);
        for (const l of links || []) {
          const { data: sh } = await supabase
            .from('sheets')
            .select('name, master_row_count, normal_row_count, data')
            .eq('id', (l as any).sheet_id)
            .maybeSingle();
          if (!sh) continue;
          if ((sh.master_row_count || 0) <= 0) continue;
          const arr: any[] = Array.isArray(sh.data) ? (sh.data as any[]) : [];
          const normals = arr.filter((r) => (r?.kind || 'normal') === 'normal');
          const nCount = Math.max(sh.normal_row_count || 1, 1);
          if (normals.length < nCount) {
            throw new Error(`Family Sheet Limit is Full for "${sh.name}". Please manage a new account to create new order.`);
          }
          const lastStart = Math.floor((normals.length - 1) / nCount) * nCount;
          const lastGroup = normals.slice(lastStart);
          const hasEmpty = lastGroup.some((r) => !((r?.orderId || '').toString().trim()));
          if (!hasEmpty) {
            throw new Error(`Family Sheet Limit is Full for "${sh.name}". Please manage a new account to create new order.`);
          }
        }
      }

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: selectedCustomer.user_id,
        total: parseFloat(newAmount),
        status: finalStatus as any,
        payment_status: finalStatus === 'completed' ? 'paid' : 'pending',
        payment_method: newPaymentMethod,
        created_at: kathmanduToUTC(newOrderDate),
        manual_sheet_link: newManualSheetLink,
      } as any).select().single();
      if (orderError) throw orderError;

      // Build input field responses (optional for admin — only include filled values)
      const responses: FieldResponse[] = (newActiveFields || [])
        .map((f) => {
          const val = newFieldValues[f.id];
          const isEmpty =
            val === undefined ||
            val === '' ||
            (Array.isArray(val) && val.length === 0);
          if (isEmpty) return null;
          return {
            field_id: f.id,
            field_name: f.name,
            field_type: f.field_type,
            label: f.label,
            question: f.question,
            value: val as string | string[],
          } as FieldResponse;
        })
        .filter((r): r is FieldResponse => r !== null);

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: newProductId,
        variation_id: newVariationId || null,
        variation_name: variation?.name || null,
        price: parseFloat(newAmount),
        quantity: 1,
        input_field_responses: responses as any,
      });
      if (itemError) throw itemError;

      // Save remarks as an admin-only order note
      if (newRemarks.trim() && user) {
        await supabase.from('order_notes').insert({
          order_id: order.id,
          note: newRemarks.trim(),
          sent_by: user.id,
          is_admin_only: true,
        });
      }

      // Audit: record manual order creation by admin/editor
      if (user) {
        await supabase.from('order_audit_log').insert({
          order_id: order.id,
          changed_by: user.id,
          action: 'order_created',
          details: 'Order created manually',
        });
      }

      // Cleanup expired assignments and auto-assign family sharing credentials
      if (newVariationId) {
        await supabase.rpc('cleanup_expired_assignments');
        const { data: links } = await supabase
          .from('credential_variant_links')
          .select('credential_id, priority')
          .eq('variant_id', newVariationId)
          .order('priority');
        if (links?.length) {
          for (const link of links) {
            const { data: cred } = await supabase
              .from('family_sharing_credentials')
              .select('assigned_count, max_limit')
              .eq('id', link.credential_id)
              .single();
            if (!cred || cred.assigned_count >= cred.max_limit) continue;

            const { data: varData } = await supabase
              .from('product_variations')
              .select('expiry_days')
              .eq('id', newVariationId)
              .single();

            await supabase.from('credential_assignments').insert({
              credential_id: link.credential_id,
              order_id: order.id,
              user_id: selectedCustomer.user_id,
              validity_days: varData?.expiry_days || null,
            });

            await supabase
              .from('family_sharing_credentials')
              .update({ assigned_count: (cred.assigned_count || 0) + 1 })
              .eq('id', link.credential_id);

            if (user) {
              await sendFamilySharingOrderNote({
                credentialId: link.credential_id,
                orderId: order.id,
                adminUserId: user.id,
              });
            }

            break;
          }
        }
      }

      // Email logic:
      //  - family-sharing variant → new-order + order-completed (with template as adminMessage)
      //  - regular variant → new-order only; suppress later order-completed when admin completes the order
      {
        try {
          const [{ data: profile }, { data: logoSetting }] = await Promise.all([
            supabase.from('profiles').select('email, phone').eq('user_id', selectedCustomer.user_id).maybeSingle(),
            supabase.from('site_settings').select('value').eq('key', 'email_logo_url').maybeSingle(),
          ]);
          const productName = `${product?.name || 'Item'}${variation?.name ? ` - ${variation.name}` : ''}`;
          const paymentLabel = newPaymentMethod.charAt(0).toUpperCase() + newPaymentMethod.slice(1);

          if (profile?.email) {
            const baseData = {
              customerEmail: profile.email,
              customerPhone: profile.phone || '',
              productName,
              orderId: order.order_number,
              amount: String(parseFloat(newAmount)),
              logoUrl: logoSetting?.value || '',
            };
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'new-order',
                recipientEmail: profile.email,
                idempotencyKey: `new-order-${order.id}`,
                templateData: { ...baseData, paymentMethod: paymentLabel },
              },
            });
            if (isFamilySharing) {
              const adminMessage = newRemarks.trim() || familyOrderNoteTemplate || '';
              await supabase.functions.invoke('send-transactional-email', {
                body: {
                  templateName: 'order-completed',
                  recipientEmail: profile.email,
                  idempotencyKey: `order-completed-${order.id}`,
                  templateData: { ...baseData, paymentMethod: paymentLabel, adminMessage },
                },
              });
            }
          }
        } catch (emailErr) {
          console.error('Failed to send order emails:', emailErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Order ${order.order_number} Created Successfully`);
      // Reset form for next order
      setNewOrderDate(getKathmanduNowLocal());
      setCustomerSearch('');
      setCustomerResults([]);
      setSelectedCustomer(null);
      setCustomerError('');
      setNewProductId('');
      setNewVariationId('');
      setNewAmount('');
      setNewPaymentMethod('manual');
      setNewRemarks('');
      setNewManualSheetLink(false);
      setNewFieldValues({});
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const newProductVariations = useMemo(() => {
    if (!newProductId) return [];
    const product = products?.find((p: any) => p.id === newProductId);
    return (product as any)?.product_variations || [];
  }, [newProductId, products]);

  const newSelectedVariation = useMemo(() => {
    if (!newVariationId) return null;
    return (newProductVariations || []).find((v: any) => v.id === newVariationId) || null;
  }, [newVariationId, newProductVariations]);

  // Reset field values when product/variation changes
  useEffect(() => {
    setNewFieldValues({});
  }, [newProductId, newVariationId]);

  const useVariationFields = !!newSelectedVariation?.has_special_input_fields;

  const { data: newProductFields } = useQuery({
    queryKey: ['add-order-product-fields', newProductId],
    enabled: !!newProductId && !useVariationFields,
    queryFn: async () => {
      const { data } = await supabase
        .from('product_input_fields')
        .select('input_field_id, sort_order, input_fields(*)')
        .eq('product_id', newProductId)
        .order('sort_order');
      return (data || []).map((r: any) => r.input_fields).filter(Boolean) as InputFieldDef[];
    },
  });

  const { data: newVariationFields } = useQuery({
    queryKey: ['add-order-variation-fields', newVariationId],
    enabled: !!newVariationId && useVariationFields,
    queryFn: async () => {
      const { data } = await supabase
        .from('variation_input_fields')
        .select('input_field_id, sort_order, input_fields(*)')
        .eq('variation_id', newVariationId)
        .order('sort_order');
      return (data || []).map((r: any) => r.input_fields).filter(Boolean) as InputFieldDef[];
    },
  });

  const { data: newVariationSheetLinks } = useQuery({
    queryKey: ['add-order-variation-sheet-links', newVariationId],
    enabled: !!newVariationId,
    queryFn: async () => {
      const { data } = await supabase
        .from('sheet_variant_links')
        .select('sheet_id')
        .eq('variation_id', newVariationId);
      return data || [];
    },
  });
  const newVariationLinkedToSheet = (newVariationSheetLinks?.length || 0) > 0;
  const newActiveFields: InputFieldDef[] = useVariationFields
    ? (newVariationFields || [])
    : (newProductFields || []);


  // Compute each user's first order id
  const firstOrderMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!orders) return map;
    const sorted = [...orders].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const o of sorted) {
      if (!map[o.user_id]) map[o.user_id] = o.id;
    }
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order: any) => {
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const email = order.profiles?.email?.toLowerCase() || '';
        const phone = order.profiles?.phone || '';
        const orderNum = (order.order_number || '').toLowerCase();
        const inputMatch = (order.order_items || []).some((it: any) => {
          const responses = Array.isArray(it.input_field_responses) ? it.input_field_responses : [];
          return responses.some((r: any) => {
            const v = r?.value;
            if (v == null) return false;
            if (Array.isArray(v)) return v.some((x: any) => String(x).toLowerCase().includes(term));
            if (typeof v === 'object') return JSON.stringify(v).toLowerCase().includes(term);
            return String(v).toLowerCase().includes(term);
          });
        });
        if (!email.includes(term) && !phoneMatches(phone, term) && !orderNum.includes(term) && !inputMatch) return false;
      }
      if (productFilter !== 'all') {
        if (productFilter.startsWith('variation:')) {
          const vid = productFilter.slice('variation:'.length);
          const hasVariation = order.order_items?.some((i: any) => i.variation_id === vid);
          if (!hasVariation) return false;
        } else {
          const pid = productFilter.startsWith('product:') ? productFilter.slice('product:'.length) : productFilter;
          const hasProduct = order.order_items?.some((i: any) => i.product_id === pid);
          if (!hasProduct) return false;
        }
      }
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (dateFrom) {
        const orderDate = new Date(order.created_at);
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
        if (orderDate < from) return false;
      }
      if (dateTo) {
        const orderDate = new Date(order.created_at);
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }
      if (paymentFilter !== 'all') {
        const method = order.payment_pidx ? 'khalti' : 'manual';
        if (paymentFilter !== method) return false;
      }
      return true;
    });
  }, [orders, searchTerm, productFilter, statusFilter, dateFrom, dateTo, paymentFilter]);

  const { requestExport, dialog: exportDialog } = useExportFormat();

  const handleExportOrders = () => {
    const source = (filteredOrders && filteredOrders.length > 0) ? filteredOrders : (orders || []);
    if (!source || source.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const fmtVal = (v: any) => {
      if (v == null) return '';
      if (Array.isArray(v)) return v.join(', ');
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };
    const fieldLabel = (r: any) => r?.label || r?.field_name || r?.name || r?.field_id || 'Field';

    // Collect all unique field labels across all items so each becomes its own column
    const allLabels = new Set<string>();
    source.forEach((o: any) => {
      (o.order_items || []).forEach((it: any) => {
        const responses = Array.isArray(it.input_field_responses) ? it.input_field_responses : [];
        responses.forEach((r: any) => allLabels.add(fieldLabel(r)));
      });
    });
    const labelCols = Array.from(allLabels);

    const ordersRows: any[] = [];
    const itemsRows: any[] = [];

    source.forEach((o: any) => {
      const orderNum = o.order_number || o.id?.slice(0, 8) || '';
      const email = o.profiles?.email || '';
      const phone = o.profiles?.phone || '';
      const name = o.profiles?.name || '';
      const items = o.order_items || [];
      const productsStr = items
        .map((i: any) => {
          const n = i.products?.name || 'Product';
          return i.variation_name ? `${n} - ${i.variation_name}` : n;
        })
        .join(', ');

      // Aggregate all input fields across all items in this order
      const aggregatedFields: string[] = [];
      items.forEach((it: any) => {
        const responses = Array.isArray(it.input_field_responses) ? it.input_field_responses : [];
        responses.forEach((r: any) => {
          aggregatedFields.push(`${fieldLabel(r)}: ${fmtVal(r?.value)}`);
        });
      });

      ordersRows.push({
        'Order #': orderNum,
        'Date': o.created_at ? new Date(o.created_at).toISOString() : '',
        'Completed At': o.completed_at ? new Date(o.completed_at).toISOString() : '',
        'Customer Name': name,
        'Email': email,
        'Phone': phone,
        'Status': o.status,
        'Payment Method': o.payment_pidx ? 'Khalti' : (o.payment_method || 'Manual'),
        'Payment Status': o.payment_status || '',
        'Total': o.total ?? 0,
        'Refund Amount': o.refund_amount ?? '',
        'Items Count': items.length,
        'Products': productsStr,
        'Input Fields': aggregatedFields.join(' | '),
      });

      items.forEach((it: any) => {
        const responses = Array.isArray(it.input_field_responses) ? it.input_field_responses : [];
        const byLabel: Record<string, string> = {};
        responses.forEach((r: any) => {
          byLabel[fieldLabel(r)] = fmtVal(r?.value);
        });
        const combined = responses.map((r: any) => `${fieldLabel(r)}: ${fmtVal(r?.value)}`).join(' | ');

        const row: any = {
          'Order #': orderNum,
          'Email': email,
          'Phone': phone,
          'Product': it.products?.name || '',
          'Variation': it.variation_name || '',
          'Quantity': it.quantity ?? 1,
          'Price': it.price ?? 0,
          'Input Fields (combined)': combined,
        };
        labelCols.forEach((l) => { row[l] = byLabel[l] || ''; });
        itemsRows.push(row);
      });
    });

    const itemsHeader = ['Order #', 'Email', 'Phone', 'Product', 'Variation', 'Quantity', 'Price', 'Input Fields (combined)', ...labelCols];
    requestExport({
      filenameBase: 'orders-export',
      sheets: [
        { name: 'Orders', rows: ordersRows },
        { name: 'Order Items', rows: itemsRows, header: itemsHeader },
      ],
    });
  };

  return (
    <>
    {exportDialog}
    <div className={`flex gap-6 h-[calc(100vh-5rem)] ${selectedOrder ? 'lg:flex-row-reverse' : ''}`}>
      {/* Orders List */}
      <div className={`${selectedOrder ? 'hidden lg:block lg:flex-1' : 'flex-1'} min-w-0`}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <div className="ml-auto">
            <Button variant="outline" onClick={handleExportOrders}>
              <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          </div>
        </div>

        {/* Add Order Card (always visible) */}
        <div className="mb-4 rounded-xl border border-border bg-muted/20 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add Order</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-1">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button" title={newOrderDate ? format(new Date(newOrderDate), 'PPP p') : 'Pick date'}>
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newOrderDate ? new Date(newOrderDate) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        const prev = newOrderDate ? new Date(newOrderDate) : new Date();
                        d.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                        const pad = (n: number) => String(n).padStart(2, '0');
                        setNewOrderDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                      }}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative md:col-span-4">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number / Email</Label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <span className="text-foreground truncate">
                      {(selectedCustomer.email || '—')} | {(selectedCustomer.phone || '—')}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 ml-2"
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    placeholder="Search by email or phone..."
                    value={customerSearch}
                    onChange={e => handleCustomerSearch(e.target.value)}
                  />
                )}
                {!selectedCustomer && customerSearching && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
                {!selectedCustomer && customerError && <p className="text-xs text-destructive mt-1">{customerError}</p>}
                {customerResults.length > 0 && !selectedCustomer && (
                  <div className="absolute z-50 left-0 right-0 mt-1 border border-border rounded-md bg-popover shadow-lg max-h-40 overflow-y-auto">
                    {customerResults.map(c => (
                      <button
                        key={c.user_id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch(c.email || c.phone || '');
                          setCustomerResults([]);
                          setCustomerError('');
                        }}
                      >
                        <span className="text-foreground">{c.name || c.email}</span>
                        <span className="text-xs text-muted-foreground">{c.email} · {c.phone || 'No phone'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-4">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product</Label>
                {(() => {
                  const options: { productId: string; variationId: string; label: string; price: number }[] = [];
                  (products || []).forEach((p: any) => {
                    const vars = (p.product_variations || []).filter((v: any) => v.is_active !== false);
                    if (vars.length > 0) {
                      vars.forEach((v: any) => options.push({
                        productId: p.id,
                        variationId: v.id,
                        label: `${p.name} — ${v.name}`,
                        price: Number(v.price) || 0,
                      }));
                    } else {
                      options.push({ productId: p.id, variationId: '', label: p.name, price: Number(p.price) || 0 });
                    }
                  });
                  const q = productPickerSearch.trim().toLowerCase();
                  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
                  const selected = options.find(o => o.productId === newProductId && (o.variationId || '') === (newVariationId || ''));
                  return (
                    <div className="relative">
                      <Input
                        placeholder="Choose one (optional)"
                        value={productPickerOpen ? productPickerSearch : (selected?.label || '')}
                        onFocus={() => { setProductPickerOpen(true); setProductPickerSearch(''); }}
                        onChange={(e) => { setProductPickerSearch(e.target.value); setProductPickerOpen(true); }}
                        onBlur={() => setTimeout(() => setProductPickerOpen(false), 150)}
                      />
                      {productPickerOpen && (
                        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                          {filtered.length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
                          )}
                          {filtered.map((o) => (
                            <button
                              key={`${o.productId}-${o.variationId}`}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex justify-between gap-2"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewProductId(o.productId);
                                setNewVariationId(o.variationId);
                                setNewAmount(String(o.price));
                                setProductPickerOpen(false);
                                setProductPickerSearch('');
                              }}
                            >
                              <span className="truncate">{o.label}</span>
                              <span className="text-muted-foreground shrink-0">NPR {o.price}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="md:col-span-3">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</Label>
                <Input
                  type="number"
                  placeholder="Rs."
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 mt-4 ${newActiveFields.length > 0 ? 'md:grid-cols-2 items-stretch' : 'md:grid-cols-12 items-end'}`}>
              {newActiveFields.length > 0 && (
                <div className="space-y-3">
                  {newActiveFields.map((f) => (
                    <InputFieldRenderer
                      key={f.id}
                      field={f}
                      value={newFieldValues[f.id]}
                      onChange={(val) => setNewFieldValues((prev) => ({ ...prev, [f.id]: val }))}
                    />
                  ))}
                </div>
              )}

              {newVariationLinkedToSheet && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="manual-sheet-link"
                    type="checkbox"
                    checked={newManualSheetLink}
                    onChange={(e) => setNewManualSheetLink(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="manual-sheet-link" className="text-xs text-muted-foreground cursor-pointer">
                    Manual Sheet Link
                  </Label>
                </div>
              )}

              {newActiveFields.length > 0 ? (
                <div className="flex gap-3 h-full">
                  <div className="flex flex-col flex-1 min-h-0">
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Remarks</Label>
                    <Textarea
                      placeholder="Optional notes about this order (admin-only)"
                      value={newRemarks}
                      onChange={e => setNewRemarks(e.target.value)}
                      className="flex-1 min-h-10 resize-y"
                    />
                  </div>
                  <div className="flex items-start pt-[26px]">
                    <Button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder || !selectedCustomer || !newProductId || !newAmount}
                    >
                      {creatingOrder ? 'Creating...' : 'Create Order'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="md:col-span-9">
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Remarks</Label>
                    <Textarea
                      placeholder="Optional notes about this order (admin-only)"
                      value={newRemarks}
                      onChange={e => setNewRemarks(e.target.value)}
                      rows={1}
                      className="min-h-10 h-10 py-2 resize-y"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button
                      className="w-full"
                      onClick={handleCreateOrder}
                      disabled={creatingOrder || !selectedCustomer || !newProductId || !newAmount}
                    >
                      {creatingOrder ? 'Creating...' : 'Create Order'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(sanitizeSearchInput(e.target.value))} placeholder="Search email, phone, order ID" className="pl-9" />
          </div>

          {/* Searchable Product filter */}
          <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {(() => {
                    if (productFilter === 'all') return 'All Products';
                    if (productFilter.startsWith('variation:')) {
                      const vid = productFilter.slice('variation:'.length);
                      for (const p of (products || []) as any[]) {
                        const v = (p.product_variations || []).find((x: any) => x.id === vid);
                        if (v) return `${p.name} - ${v.name}`;
                      }
                      return 'Variation';
                    }
                    const pid = productFilter.startsWith('product:') ? productFilter.slice('product:'.length) : productFilter;
                    return (products?.find((p: any) => p.id === pid)?.name || 'Product');
                  })()}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-2 border-b border-border">
                <Input
                  autoFocus
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                <button
                  type="button"
                  onClick={() => { setProductFilter('all'); setProductPopoverOpen(false); setProductSearch(''); }}
                  className={cn('w-full text-left px-3 py-1.5 text-sm hover:bg-muted', productFilter === 'all' && 'bg-muted font-medium')}
                >
                  All Products
                </button>
                {(() => {
                  const term = productSearch.toLowerCase();
                  const filteredProducts = (products || []).filter((p: any) => {
                    if (p.name.toLowerCase().includes(term)) return true;
                    return (p.product_variations || []).some((v: any) => v.name.toLowerCase().includes(term));
                  });
                  if (filteredProducts.length === 0) {
                    return <p className="px-3 py-2 text-xs text-muted-foreground">No products found</p>;
                  }
                  return filteredProducts.map((p: any) => {
                    const productKey = `product:${p.id}`;
                    const variations = (p.product_variations || []).filter((v: any) =>
                      !term || p.name.toLowerCase().includes(term) || v.name.toLowerCase().includes(term)
                    );
                    return (
                      <div key={p.id}>
                        <button
                          type="button"
                          onClick={() => { setProductFilter(productKey); setProductPopoverOpen(false); setProductSearch(''); }}
                          className={cn('w-full text-left px-3 py-1.5 text-sm font-medium hover:bg-muted', productFilter === productKey && 'bg-muted')}
                        >
                          {p.name}
                        </button>
                        {variations.map((v: any) => {
                          const vKey = `variation:${v.id}`;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => { setProductFilter(vKey); setProductPopoverOpen(false); setProductSearch(''); }}
                              className={cn('w-full text-left pl-6 pr-3 py-1 text-xs text-muted-foreground hover:bg-muted', productFilter === vKey && 'bg-muted text-foreground font-medium')}
                            >
                              ↳ {v.name}
                            </button>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </div>
            </PopoverContent>
          </Popover>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClassName}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* From date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              {dateFrom && (
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateFrom(undefined)}>Clear</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* To date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              {dateTo && (
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateTo(undefined)}>Clear</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={selectClassName}>
            <option value="all">All Payments</option>
            <option value="khalti">Khalti</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-14rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer ${selectedOrder?.id === order.id ? 'bg-muted/50' : ''}`}
                    onClick={() => openOrderDetail(order)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {order.order_number || order.id.slice(0, 8)}
                    </TableCell>
                    
                    <TableCell className="text-foreground">
                      <span>{order.profiles?.email || '-'}</span>
                      <CopyButton value={order.profiles?.email} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span>{order.profiles?.phone || '-'}</span>
                      <CopyButton value={order.profiles?.phone} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        const productsStr = order.order_items
                          ?.map((i: any) => {
                            const name = i.products?.name || 'Product';
                            return i.variation_name ? `${name} - ${i.variation_name}` : name;
                          })
                          .filter(Boolean)
                          .join(', ');
                        return (
                          <>
                            <span>{productsStr}</span>
                            <CopyButton value={productsStr} />
                          </>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeDate(order.created_at)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">NPR {order.total}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.payment_pidx ? 'Khalti' : 'Manual'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || ''}`}>
                          {order.status === 'on_hold' ? 'On Hold' : order.status}
                        </span>
                        {firstOrderMap[order.user_id] === order.id ? (
                          <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                            <Star className="h-3 w-3" /> First Order
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <RefreshCw className="h-3 w-3" /> Recurring
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {selectedOrder && (
        <div className="w-full lg:w-[720px] lg:min-w-[720px] border border-border rounded-lg bg-background flex flex-col max-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Edit Order {selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Customer Information */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Customer Information</Label>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{formatDateTime(selectedOrder.created_at)}</span></p>
                  <p><span className="text-muted-foreground">Ordered By:</span> <span className="text-foreground">{selectedOrder?.profiles?.name || selectedOrder?.profiles?.email || '-'}</span></p>
                  <p><span className="text-muted-foreground">Customer:</span> <span className="text-foreground">{selectedOrder?.profiles?.email || '-'}</span></p>
                  <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedOrder?.profiles?.phone || '-'}</span></p>
                </div>
              </div>

              {/* Family Sharing — Static Note Sent moved below Update Order button */}

              {/* Payment Information */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Payment Information</Label>
                <div className="bg-muted/30 rounded-lg p-3 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Payment Method:</span> <span className="text-foreground">{selectedOrder?.payment_pidx ? 'Khalti' : 'N/A'}</span></p>
                  <p><span className="text-muted-foreground">Total Amount:</span> <span className="font-semibold text-foreground">NPR {selectedOrder?.total}</span></p>
                  <p>
                    <span className="text-muted-foreground">Payment Status:</span>{' '}
                    {selectedOrder?.payment_status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">Success</span>
                    ) : !selectedOrder?.payment_pidx ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">Manual</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                        {selectedOrder?.payment_status === 'failed' ? 'Failed' : selectedOrder?.payment_status === 'expired' ? 'Failed' : 'Cancelled'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Customer Submitted Information */}
              {(() => {
                const items = (selectedOrder?.order_items || []) as any[];
                const itemsWithResponses = items.filter((it) => Array.isArray(it.input_field_responses) && it.input_field_responses.length > 0);
                if (itemsWithResponses.length === 0) return null;
                return (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Customer Submitted Information</Label>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                      {itemsWithResponses.map((it: any) => {
                        const productName = it.products?.name || 'Product';
                        const label = it.variation_name ? `${productName} — ${it.variation_name}` : productName;
                        const responses = it.input_field_responses as any[];
                        return (
                          <div key={it.id} className="space-y-2">
                            <p className="text-xs font-semibold text-foreground">{label}</p>
                            <div className="space-y-1.5 pl-2 border-l-2 border-primary/40">
                              {responses.map((r: any, idx: number) => {
                                const heading = r.question || r.label || r.field_name || 'Field';
                                const val = Array.isArray(r.value) ? (r.value.length ? r.value.join(', ') : '—') : (r.value === '' || r.value == null ? '—' : String(r.value));
                                 const canCopy = val && val !== '—';
                                return (
                                  <div key={idx} className="text-sm pl-2">
                                    <p className="text-xs text-muted-foreground">{heading}</p>
                                    <p className="text-foreground break-words whitespace-pre-wrap inline">
                                      <span>{val}</span>
                                      {canCopy && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(val);
                                            toast.success('Copied to clipboard');
                                          }}
                                          className="text-muted-foreground hover:text-foreground transition-colors inline-flex align-middle ml-1.5"
                                          title="Copy"
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Products</Label>
                  <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {editItems.map((item, index) => {
                    const variations = getVariationsForProduct(item.product_id);
                    return (
                      <div key={item.id} className="bg-muted/20 rounded-lg p-2">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Product</Label>
                            <Select value={item.product_id} onValueChange={(v) => handleProductChange(index, v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                              <SelectContent>
                                {products?.map((p: any) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Variation</Label>
                            <Select value={item.variation_id} onValueChange={(v) => handleVariationChange(index, v)} disabled={!variations.length}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={variations.length ? "Select variation" : "No variations"} /></SelectTrigger>
                              <SelectContent>
                                {variations.map((v: any) => (
                                  <SelectItem key={v.id} value={v.id}>{v.name} — NPR {v.price}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeItem(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-total" className="text-xs text-muted-foreground">Total (NPR)</Label>
                  <Input id="edit-total" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} type="number" />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-xs text-muted-foreground">Status</Label>
                   <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status" className="capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['pending', 'processing', 'on_hold', 'completed', 'cancelled', 'refunded'].map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s === 'on_hold' ? 'On Hold' : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="edit-manual-sheet-link"
                  type="checkbox"
                  checked={editManualSheetLink}
                  onChange={(e) => setEditManualSheetLink(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-manual-sheet-link" className="text-xs text-muted-foreground cursor-pointer">
                  Manual Sheet Link
                </Label>
              </div>


              {editStatus === 'refunded' && (
                <div className="border border-border rounded-md p-3 bg-muted/20 space-y-3">
                  <Label className="text-xs text-muted-foreground">Refund Type</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="refund-type"
                        value="full"
                        checked={refundType === 'full'}
                        onChange={() => { setRefundType('full'); setRefundAmount(''); }}
                      />
                      Full Refund (NPR {parseFloat(editTotal) || selectedOrder?.total || 0})
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="refund-type"
                        value="partial"
                        checked={refundType === 'partial'}
                        onChange={() => setRefundType('partial')}
                      />
                      Partial Refund
                    </label>
                  </div>
                  {refundType === 'partial' && (
                    <div>
                      <Label htmlFor="refund-amount" className="text-xs text-muted-foreground">Refund Amount (NPR)</Label>
                      <Input
                        id="refund-amount"
                        type="number"
                        min="0"
                        max={editTotal}
                        step="0.01"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder={`Max ${parseFloat(editTotal) || selectedOrder?.total || 0}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Customer Note */}
              <div className="border-t border-border pt-4">
                <Label className="text-xs text-muted-foreground mb-1 block">Customer Note (optional)</Label>
                {editStatus === 'completed' && selectedOrder?.status !== 'completed' && (
                  <p className="text-[11px] text-primary mb-1">
                    This note will be included in the "Order Completed" email sent to the customer (unless marked admin-only).
                  </p>
                )}
                <RichTextEditor value={orderNote} onChange={setOrderNote} />
                {productNotes && productNotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <Label className="text-[10px] text-muted-foreground block uppercase tracking-wide">Product Notes (click to paste)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {productNotes.map((n: any) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setOrderNote(prev => stripHtml(prev) ? `${prev}${n.description}` : n.description)}
                          className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-colors border border-border"
                          title={`${(n.products as any)?.name || ''} — click to paste`}
                        >
                          {n.heading || 'Untitled note'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox id="admin-only" checked={isAdminOnly} onCheckedChange={(v) => setIsAdminOnly(!!v)} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="admin-only" className="text-xs text-muted-foreground cursor-pointer">Admin only (not visible to customer)</Label>
                </div>
              </div>

              <Button onClick={handleUpdateOrder} disabled={sending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {sending ? 'Updating...' : 'Update Order'}
              </Button>

              {/* Family Sharing — Static Note Sent History */}
              {familySharingInfo?.isFamilySharing && familySharingInfo.templates.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                    <Label className="text-xs text-muted-foreground">Static Note Sent (Family Sharing)</Label>
                    {familySharingInfo.sentNotes && familySharingInfo.sentNotes.length > 0 && familySharingInfo.sentNotes[0].senderEmail && (
                      <span className="text-xs text-muted-foreground">
                        | Created by: <span className="text-foreground font-medium">{familySharingInfo.sentNotes[0].senderEmail}</span>
                      </span>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3 text-sm">
                    {(familySharingInfo.sentNotes && familySharingInfo.sentNotes.length > 0
                      ? familySharingInfo.sentNotes.map(n => n.note)
                      : familySharingInfo.templates
                    ).map((t, i) => (
                      <div
                        key={i}
                        className="prose prose-sm prose-invert max-w-none text-foreground [&_*]:text-foreground"
                        dangerouslySetInnerHTML={{ __html: t }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Change History (audit log) */}
              {auditLog && auditLog.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground block">Change History</Label>
                  <div className="space-y-1.5">
                    {auditLog.map((log: any) => {
                      const who = log.profile?.email || log.profile?.name || 'Unknown';
                      return (
                        <div key={log.id} className="bg-muted/30 rounded-md p-2 text-xs">
                          <p className="text-foreground">{log.details}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            by <span className="text-foreground font-medium">{who}</span> · {formatDateTime(log.created_at)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>
        </div>
      )}

    </div>
    </>
  );
};

export default AdminOrders;
