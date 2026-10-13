"use client";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Newspaper, Send, Building2 } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchFeed, createPost, toggleLike } from "@/redux/slice/socialSlice";
import { cn, timeAgo } from "@/lib/utils";

export default function FeedPage() {
  const dispatch = useAppDispatch();
  const { posts, feedLoading } = useAppSelector((s) => s.social);
  const { user } = useAppSelector((s) => s.auth);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => { dispatch(fetchFeed({ limit: 20 })); }, [dispatch]);

  const publish = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    await dispatch(createPost(draft.trim()));
    setPosting(false);
    setDraft("");
  };

  return (
    <>
      <Topbar title="Feed" subtitle="From your connections and the companies you follow" />

      <div className="w-full px-5 lg:px-9 py-6">
        <Card className="p-4 mb-5">
          <div className="flex gap-3">
            <Avatar name={user?.name || "?"} src={user?.profileImage} size="sm" />
            <div className="flex-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Share an update with your network"
                rows={draft ? 3 : 1}
                className="w-full resize-none bg-transparent text-[14.5px] text-ink placeholder:text-muted-2 outline-none pt-2 transition-all"
              />
              {draft && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-line-soft rise">
                  <Button size="sm" variant="ghost" onClick={() => setDraft("")}>Discard</Button>
                  <Button size="sm" onClick={publish} loading={posting}>
                    <Send size={14} /> Post
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {feedLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <EmptyState
              icon={Newspaper}
              title="Your feed is quiet"
              body="Connect with people and follow companies — their updates will collect here."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((p) => (
              <Card key={p._id} className="p-5">
                <div className="flex items-center gap-3 mb-3.5">
                  {p.company ? (
                    <span className="grid place-items-center h-9 w-9 rounded-[var(--radius-sm)] bg-ink text-white shrink-0">
                      <Building2 size={16} />
                    </span>
                  ) : (
                    <Avatar name={p.author.name} src={p.author.profileImage} size="sm" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink truncate">
                      {p.company ? p.company.name : p.author.name}
                    </p>
                    <p className="text-[12px] text-muted truncate">
                      {p.company ? `Posted by ${p.author.name}` : p.author.headline || ""}
                      {" · "}{timeAgo(p.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="text-[14.5px] leading-relaxed text-ink whitespace-pre-line mb-4">{p.content}</p>

                {p.media?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.media.url} alt="" className="w-full rounded-[var(--radius-sm)] border border-line mb-4" />
                )}

                <div className="flex items-center gap-1 pt-3 border-t border-line-soft">
                  <button
                    onClick={() => dispatch(toggleLike(p._id))}
                    className={cn("flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] transition-colors cursor-pointer",
                      p.isLiked ? "text-stage-rejected" : "text-muted hover:text-ink hover:bg-line-soft")}
                    aria-pressed={p.isLiked}
                  >
                    <Heart size={15} fill={p.isLiked ? "currentColor" : "none"} />
                    {p.likeCount > 0 && <span className="num">{p.likeCount}</span>}
                    <span>{p.isLiked ? "Liked" : "Like"}</span>
                  </button>
                  <span className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-muted">
                    <MessageCircle size={15} />
                    {p.commentCount > 0 && <span className="num">{p.commentCount}</span>}
                    <span>{p.commentCount === 1 ? "comment" : "comments"}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
