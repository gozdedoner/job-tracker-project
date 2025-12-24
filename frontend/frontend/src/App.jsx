import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "job-tracker-jobs";

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("applied");
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);

  /* LOAD */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setJobs(JSON.parse(saved));

    fetch("http://127.0.0.1:8000/jobs")
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      })
      .finally(() => setLoading(false));
  }, []);

  /* SAVE */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const updateStatus = (id, newStatus) => {
    fetch(`http://127.0.0.1:8000/jobs/${id}?status=${newStatus}`, {
      method: "PUT",
    })
      .then((res) => res.json())
      .then((updated) =>
        setJobs((prev) =>
          prev.map((j) => (j.id === id ? updated : j))
        )
      );
  };

  const applied = jobs.filter((j) => j.status === "applied");
  const interview = jobs.filter((j) => j.status === "interview");
  const rejected = jobs.filter((j) => j.status === "rejected");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold">Job Tracker</h1>
          <p className="text-zinc-400">Track applications. Stay focused.</p>
        </header>

        {/* VIEW TOGGLE */}
        <div className="flex justify-end mb-6">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {["list", "kanban"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  view === v
                    ? "bg-white text-black"
                    : "text-zinc-400"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ADD JOB */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetch("http://127.0.0.1:8000/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title, company, status }),
            })
              .then((res) => res.json())
              .then((newJob) => {
                setJobs([newJob, ...jobs]);
                setTitle("");
                setCompany("");
              });
          }}
          className="mb-10 p-6 bg-white/5 rounded-2xl flex flex-col gap-4"
        >
          <input
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700"
            required
          />
          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700"
            required
          />
          <button className="py-3 rounded-xl bg-emerald-400 text-black font-semibold">
            + Add Job
          </button>
        </form>

        {/* LOADING POLISH */}
        {loading && <SkeletonList />}

        {/* LIST VIEW */}
        {!loading && view === "list" && (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <motion.li
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white/5 flex justify-between"
              >
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-zinc-400">{job.company}</p>
                </div>

                <select
                  value={job.status}
                  onChange={(e) =>
                    updateStatus(job.id, e.target.value)
                  }
                  className="px-3 py-1 rounded bg-zinc-800 border border-zinc-600 text-xs"
                >
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                </select>
              </motion.li>
            ))}
          </ul>
        )}

        {/* KANBAN + DRAG DROP */}
        {!loading && view === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Kanban title="Applied" jobs={applied} onDropStatus="applied" onUpdate={updateStatus} />
            <Kanban title="Interview" jobs={interview} onDropStatus="interview" onUpdate={updateStatus} />
            <Kanban title="Rejected" jobs={rejected} onDropStatus="rejected" onUpdate={updateStatus} />
          </div>
        )}
      </div>
    </div>
  );
}

/* KANBAN COLUMN */
function Kanban({ title, jobs, onDropStatus, onUpdate }) {
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[300px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("id");
        onUpdate(Number(id), onDropStatus);
      }}
    >
      <h3 className="font-semibold mb-4">{title}</h3>

      <div className="space-y-3">
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("id", job.id)
            }
            layout
            className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 cursor-grab"
          >
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-zinc-400">{job.company}</p>
          </motion.div>
        ))}

        {jobs.length === 0 && (
          <p className="text-sm text-zinc-500">Drop here</p>
        )}
      </div>
    </div>
  );
}

/* LOADING SKELETON */
function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse"
        />
      ))}
    </div>
  );
}



