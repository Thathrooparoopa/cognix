import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const subjectSuggestions = [
  "Data Structures",
  "Database Management Systems",
  "Operating Systems",
  "Computer Networks",
  "Theory of Computation",
  "Design and Analysis of Algorithms",
];

const formatFileSize = (bytes) => {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
};

export default function LearningSpace() {
  const syllabusInputRef = useRef(null);
  const notesInputRef = useRef(null);

  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");

  const [syllabusFile, setSyllabusFile] = useState(null);
  const [notesFile, setNotesFile] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createdSpace, setCreatedSpace] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [learningSpaces, setLearningSpaces] = useState([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  const loadLearningSpaces = async () => {
    try {
      setLoadingSpaces(true);
      setLoadingError("");

      const response = await fetch(
        `${API_URL}/api/learning-spaces`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load your Learning Spaces."
        );
      }

      setLearningSpaces(result.data || []);
    } catch (error) {
      console.error(
        "Load Learning Spaces error:",
        error
      );

      setLoadingError(
        error.message ||
          "Unable to load your Learning Spaces."
      );
    } finally {
      setLoadingSpaces(false);
    }
  };

  useEffect(() => {
    loadLearningSpaces();
  }, []);

  const handleSyllabusChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSyllabusFile(file);
    setCreatedSpace(null);
    setErrorMessage("");
  };

  const handleNotesChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setNotesFile(file);
    setCreatedSpace(null);
    setErrorMessage("");
  };

  const removeSyllabus = () => {
    setSyllabusFile(null);
    setCreatedSpace(null);
    setErrorMessage("");

    if (syllabusInputRef.current) {
      syllabusInputRef.current.value = "";
    }
  };

  const removeNotes = () => {
    setNotesFile(null);
    setCreatedSpace(null);
    setErrorMessage("");

    if (notesInputRef.current) {
      notesInputRef.current.value = "";
    }
  };

  const selectSubject = (value) => {
    setSubject(value);
    setCreatedSpace(null);
    setErrorMessage("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setCreatedSpace(null);

    if (!subject.trim()) {
      setErrorMessage("Please enter a subject.");
      return;
    }

    if (!syllabusFile) {
      setErrorMessage("Please upload your syllabus.");
      return;
    }

    try {
      setCreating(true);

      const formData = new FormData();

      formData.append(
        "subject",
        subject.trim()
      );

      formData.append(
        "goal",
        goal.trim()
      );

      formData.append(
        "syllabus",
        syllabusFile
      );

      if (notesFile) {
        formData.append(
          "notes",
          notesFile
        );
      }

      const response = await fetch(
        `${API_URL}/api/learning-spaces`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to create the Learning Space."
        );
      }

      const newSpace = result.data;

      setCreatedSpace(newSpace);

      setLearningSpaces((currentSpaces) => [
        newSpace,
        ...currentSpaces,
      ]);

      setSubject("");
      setGoal("");
      setSyllabusFile(null);
      setNotesFile(null);

      if (syllabusInputRef.current) {
        syllabusInputRef.current.value = "";
      }

      if (notesInputRef.current) {
        notesInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "Create Learning Space error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Something went wrong while creating your Learning Space."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="page-container learning-space-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} />
            BUILD YOUR LEARNING ADVENTURE
          </span>

          <h1>Create a Learning Space</h1>

          <p>
            Give Cognix your subject and syllabus. Your
            learning world will transform it into units,
            topics, levels, challenges and personalized
            quests.
          </p>
        </div>
      </div>

      <div className="learning-steps">
        <div className="learning-step active">
          <strong>01</strong>
          <span>Create space</span>
        </div>

        <div className="learning-step">
          <strong>02</strong>
          <span>Build world</span>
        </div>

        <div className="learning-step">
          <strong>03</strong>
          <span>Start quest</span>
        </div>
      </div>

      <div className="learning-space-layout">
        <section className="learning-start-card">
          <div className="learning-start-icon">
            <GraduationCap size={25} />
          </div>

          <h2>Tell us what you're learning</h2>

          <p>
            Start with the subject you want to master.
            Cognix will use your syllabus as the foundation
            for your learning world.
          </p>

          <form
            className="learning-form"
            onSubmit={handleCreate}
          >
            <label>
              Subject

              <input
                type="text"
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setCreatedSpace(null);
                  setErrorMessage("");
                }}
                placeholder="e.g. Data Structures"
                disabled={creating}
              />

              <div className="subject-suggestions">
                {subjectSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      selectSubject(item)
                    }
                    disabled={creating}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </label>

            <label>
              Learning goal{" "}
              <span className="field-optional">
                Optional
              </span>

              <textarea
                value={goal}
                onChange={(event) => {
                  setGoal(event.target.value);
                  setCreatedSpace(null);
                  setErrorMessage("");
                }}
                placeholder="Example: I want to understand the concepts clearly and prepare for my university exam."
                rows={4}
                disabled={creating}
              />
            </label>

            <div className="learning-field">
              <div className="field-heading">
                <label>Syllabus</label>

                <span className="required-badge">
                  Required
                </span>
              </div>

              <input
                ref={syllabusInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleSyllabusChange}
                hidden
                disabled={creating}
              />

              {!syllabusFile ? (
                <button
                  type="button"
                  className="upload-zone"
                  onClick={() =>
                    syllabusInputRef.current?.click()
                  }
                  disabled={creating}
                >
                  <Upload size={30} />

                  <strong>
                    Upload your syllabus
                  </strong>

                  <span>
                    PDF, DOC, DOCX or TXT
                  </span>
                </button>
              ) : (
                <div className="selected-file">
                  <div className="selected-file-icon">
                    <FileText size={20} />
                  </div>

                  <div className="selected-file-info">
                    <strong>
                      {syllabusFile.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        syllabusFile.size
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeSyllabus}
                    aria-label="Remove syllabus"
                    disabled={creating}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="learning-field">
              <div className="field-heading">
                <label>Your Notes</label>

                <span className="optional-badge">
                  Optional
                </span>
              </div>

              <p className="field-help">
                Add your class notes or study material so
                Cognix can later personalize explanations
                and practice.
              </p>

              <input
                ref={notesInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleNotesChange}
                hidden
                disabled={creating}
              />

              {!notesFile ? (
                <button
                  type="button"
                  className="upload-zone notes-upload"
                  onClick={() =>
                    notesInputRef.current?.click()
                  }
                  disabled={creating}
                >
                  <FileText size={28} />

                  <strong>
                    Add your notes
                  </strong>

                  <span>
                    Upload study material
                  </span>
                </button>
              ) : (
                <div className="selected-file notes-file">
                  <div className="selected-file-icon">
                    <FileText size={20} />
                  </div>

                  <div className="selected-file-info">
                    <strong>
                      {notesFile.name}
                    </strong>

                    <span>
                      {formatFileSize(
                        notesFile.size
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={removeNotes}
                    aria-label="Remove notes"
                    disabled={creating}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="primary-button learning-submit"
              disabled={
                creating ||
                !subject.trim() ||
                !syllabusFile
              }
            >
              {creating ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="spin"
                  />
                  Creating Learning Space...
                </>
              ) : (
                <>
                  Create Learning Space
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {errorMessage && (
              <div className="learning-error">
                <AlertCircle size={20} />

                <div>
                  <strong>
                    Couldn't create the Learning Space
                  </strong>

                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {createdSpace && (
              <div className="learning-success">
                <CheckCircle2 size={20} />

                <div>
                  <strong>
                    Learning Space created
                    successfully!
                  </strong>

                  <p>
                    <strong>
                      {createdSpace.subject}
                    </strong>{" "}
                    has been saved to your Cognix
                    account database.
                  </p>

                  <div className="learning-created-meta">
                    <span>
                      ID: {createdSpace.id}
                    </span>

                    <span>
                      Status: {createdSpace.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </section>

        <aside className="learning-side">
          <div className="learning-info-card">
            <div className="learning-info-icon">
              <Lightbulb size={22} />
            </div>

            <h3>What Cognix will do</h3>

            <div className="learning-benefits">
              <div>
                <span>1</span>
                <p>
                  Understand your syllabus structure
                </p>
              </div>

              <div>
                <span>2</span>
                <p>
                  Break it into units and topics
                </p>
              </div>

              <div>
                <span>3</span>
                <p>
                  Build your learning roadmap
                </p>
              </div>

              <div>
                <span>4</span>
                <p>
                  Create challenges around concepts
                </p>
              </div>

              <div>
                <span>5</span>
                <p>
                  Adapt future activities to your
                  progress
                </p>
              </div>
            </div>
          </div>

          <div className="learning-nova-card">
            <div className="nova-icon">
              <Sparkles size={18} />
            </div>

            <h3>Nova is waiting</h3>

            <p>
              Your AI learning companion will eventually
              use your learning context to explain
              concepts, give hints and recommend what to
              do next.
            </p>
          </div>

          <Link
            to="/"
            className="secondary-button learning-back"
          >
            <ArrowRight size={15} />
            Back to Home
          </Link>
        </aside>
      </div>

      <section className="saved-learning-spaces">
        <div className="saved-learning-heading">
          <div>
            <span className="eyebrow">
              <BookOpen size={13} />
              YOUR LEARNING WORLDS
            </span>

            <h2>Your Learning Spaces</h2>

            <p>
              Your saved learning spaces are connected to
              your Cognix account.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadLearningSpaces}
            disabled={loadingSpaces}
          >
            <RefreshCw
              size={15}
              className={
                loadingSpaces ? "spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {loadingSpaces ? (
          <div className="learning-spaces-loading">
            <LoaderCircle
              size={22}
              className="spin"
            />
            <span>
              Loading your Learning Spaces...
            </span>
          </div>
        ) : loadingError ? (
          <div className="learning-error">
            <AlertCircle size={20} />

            <div>
              <strong>
                Couldn't load your Learning Spaces
              </strong>

              <p>{loadingError}</p>

              <button
                type="button"
                className="secondary-button"
                onClick={loadLearningSpaces}
              >
                Try again
              </button>
            </div>
          </div>
        ) : learningSpaces.length === 0 ? (
          <div className="learning-spaces-empty">
            <div className="learning-empty-icon">
              <BookOpen size={25} />
            </div>

            <h3>
              Your adventure starts here
            </h3>

            <p>
              Create your first Learning Space above and
              Cognix will begin building your learning
              world.
            </p>
          </div>
        ) : (
          <div className="learning-spaces-grid">
            {learningSpaces.map((space) => (
              <article
                className="learning-space-card"
                key={space._id || space.id}
              >
                <div className="learning-space-card-top">
                  <div className="learning-space-card-icon">
                    <GraduationCap size={21} />
                  </div>

                  <span
                    className={`learning-space-status status-${(
                      space.status || "created"
                    ).toLowerCase()}`}
                  >
                    {space.status || "created"}
                  </span>
                </div>

                <h3>{space.subject}</h3>

                {space.goal ? (
                  <p>
                    {space.goal}
                  </p>
                ) : (
                  <p>
                    Ready to become your next learning
                    adventure.
                  </p>
                )}

                <div className="learning-space-card-files">
                  <span>
                    <FileText size={14} />
                    {space.syllabus?.originalName ||
                      "Syllabus"}
                  </span>

                  {space.notes?.originalName && (
                    <span>
                      <FileText size={14} />
                      {space.notes.originalName}
                    </span>
                  )}
                </div>

                <div className="learning-space-card-footer">
                  <small>
                    Created{" "}
                    {formatDate(space.createdAt)}
                  </small>

                  <Link
  to={`/worlds?space=${space._id || space.id}`}
  className="learning-space-open"
>
  Open World
  <ArrowRight size={14} />
</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
