import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useRoute, parsePath } from '../lib/router';
import type { Conversation, Message } from '../lib/types';
import { AccountBadge, VerifiedBadge, Avatar } from '../components/Badges';
import { timeAgo } from '../lib/format';

export function MessagingPage() {
  const [path, navigate] = useRoute();
  const { query } = parsePath(path);
  const { user } = useAuth();

  const startListingId = query.get('listing');
  const startToId = query.get('to');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeListingId, setActiveListingId] = useState<string | null>(startListingId);
  const [activeOtherId, setActiveOtherId] = useState<string | null>(startToId);
  const [showThreadMobile, setShowThreadMobile] = useState(!!startListingId);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `id, listing_id, participant_a, participant_b, last_at,
         listing:listings(id, title, listing_type, sector),
         a:profiles!conversations_participant_a_fkey(id, full_name, account_type, company_name, is_verified),
         b:profiles!conversations_participant_b_fkey(id, full_name, account_type, company_name, is_verified),
         last_message:messages!conversations_last_message_id_fkey(id, body, created_at, sender_id)`,
      )
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('last_at', { ascending: false });

    if (!error && data) {
      const mapped = (data as any[]).map((c) => ({
        ...c,
        other: c.participant_a === user.id ? c.b : c.a,
      })) as Conversation[];
      setConversations(mapped);
    }
    setLoadingList(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-mono-label text-[11px] text-accent-600">Connexion requise</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-700">Messagerie</h1>
        <p className="mt-3 text-ink-500">Connectez-vous pour accéder à vos conversations.</p>
        <button onClick={() => navigate('/connexion')} className="btn-primary mt-6">
          Connexion
        </button>
      </div>
    );
  }

  const openConversation = (listingId: string, otherId: string) => {
    setActiveListingId(listingId);
    setActiveOtherId(otherId);
    setShowThreadMobile(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-6 border-b border-ink-200/70">
        <p className="font-mono-label text-[11px] text-accent-600">Négociations</p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-ink-700">Messagerie</h1>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12 lg:h-[600px]">
        {/* Conversation list */}
        <aside className={`lg:col-span-4 card p-0 overflow-hidden flex flex-col ${showThreadMobile ? 'hidden lg:flex' : 'flex'}`}>
          {loadingList ? (
            <div className="flex-1 flex items-center justify-center text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : conversations.length === 0 && !startListingId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
              <MessageCircle className="h-8 w-8 text-ink-300" />
              <p className="mt-3 text-sm text-ink-400">
                Aucune conversation pour le moment. Contactez un membre depuis une annonce.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-ink-200/70">
              {conversations.map((c) => {
                const isActive = c.listing_id === activeListingId && c.other?.id === activeOtherId;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.listing_id, c.other!.id)}
                    className={`w-full text-left px-4 py-3 transition ${
                      isActive ? 'bg-primary-50' : 'hover:bg-paper-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.other?.company_name ?? c.other?.full_name ?? '?'} type={c.other?.account_type} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-ink-700 truncate">
                            {c.other?.company_name ?? c.other?.full_name ?? 'Membre'}
                          </span>
                          {c.other?.is_verified && <VerifiedBadge verified size="xs" />}
                        </div>
                        <p className="text-xs text-ink-400 truncate mt-0.5">{c.listing?.title}</p>
                        {c.last_message && (
                          <p className="text-xs text-ink-500 truncate mt-0.5">{c.last_message.body}</p>
                        )}
                      </div>
                      <span className="font-mono-label text-[9px] text-ink-300 shrink-0">
                        {timeAgo(c.last_at)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Thread */}
        <div className={`lg:col-span-8 card p-0 overflow-hidden flex flex-col ${showThreadMobile ? 'flex' : 'hidden lg:flex'}`}>
          {activeListingId && activeOtherId ? (
            <Thread
              listingId={activeListingId}
              otherId={activeOtherId}
              currentUserId={user.id}
              onBack={() => setShowThreadMobile(false)}
              onMessageSent={loadConversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <p className="text-sm text-ink-400">Sélectionnez une conversation pour l'afficher.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Thread({
  listingId, otherId, currentUserId, onBack, onMessageSent,
}: {
  listingId: string;
  otherId: string;
  currentUserId: string;
  onBack: () => void;
  onMessageSent: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<{ full_name: string; company_name: string | null } | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${currentUserId})`,
      )
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoading(false);
  }, [listingId, otherId, currentUserId]);

  useEffect(() => {
    loadMessages();
    supabase
      .from('profiles')
      .select('full_name, company_name')
      .eq('id', otherId)
      .maybeSingle()
      .then(({ data }) => setOtherProfile(data));
  }, [loadMessages, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      listing_id: listingId,
      receiver_id: otherId,
      body: body.trim(),
    });
    if (!error) {
      setBody('');
      await loadMessages();
      onMessageSent();
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-ink-200/70 flex items-center gap-2">
        <button onClick={onBack} className="lg:hidden text-ink-400 hover:text-ink-600">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-ink-700">
          {otherProfile?.company_name ?? otherProfile?.full_name ?? 'Conversation'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-ink-400" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink-400 py-8">
            Aucun message. Lancez la négociation ci-dessous.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3.5 py-2 text-sm ${
                    mine ? 'bg-primary-700 text-paper-100' : 'bg-paper-100 text-ink-700 border border-ink-200/70'
                  }`}
                >
                  <p className="leading-relaxed">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-primary-200' : 'text-ink-400'}`}>
                    {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-ink-200/70 p-3 flex gap-2">
        <input
          className="field-input flex-1"
          placeholder="Écrire un message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-primary px-4">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}