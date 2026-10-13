"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import JobCard from "@/components/jobs/JobCard";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchSavedJobs } from "@/redux/slice/jobSlice";

export default function SavedPage() {
  const dispatch = useAppDispatch();
  const { saved, loading } = useAppSelector((s) => s.job);

  useEffect(() => { dispatch(fetchSavedJobs()); }, [dispatch]);

  return (
    <>
      <Topbar title="Saved jobs" subtitle={saved.length ? `${saved.length} on your shortlist` : "Your shortlist"} />
      <div className="w-full px-5 lg:px-9 py-6 full-width">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[196px]" />)}
          </div>
        ) : saved.length === 0 ? (
          <Card>
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              body="Save roles while you browse to build a shortlist you can come back to."
              action={<Link href="/jobs"><Button size="sm">Browse jobs</Button></Link>}
            />
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {saved.map((j) => <JobCard key={j._id} job={{ ...j, isSaved: true }} />)}
          </div>
        )}
      </div>
    </>
  );
}
