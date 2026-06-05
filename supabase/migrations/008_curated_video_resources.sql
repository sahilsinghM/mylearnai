-- Migration 008 — Curated best-in-class video resources
--
-- The differentiator over generic AI-generated course text is hand-picked,
-- best-in-class explainer videos per node (3Blue1Brown, StatQuest, Andrej
-- Karpathy, DeepLearning.AI, and other canonical sources). Every URL below was
-- verified to resolve to the intended video/playlist at authoring time.
--
-- These are ADDED alongside the existing authoritative docs/blog/paper
-- resources, not replacing them. Nodes without a clearly canonical video
-- (most production/ops and some builder-glue topics) keep their existing
-- curated reference and are intentionally omitted here.

INSERT INTO master_roadmap_resources
  (node_id, title, url, resource_type, depth_level, estimated_minutes)
VALUES
  -- Foundations
  ('python-proficiency', 'Python Decorators (Corey Schafer)', 'https://www.youtube.com/watch?v=FsAPt_9Bf3U', 'video', 'working', 30),
  ('python-proficiency', 'Python OOP: Classes and Instances (Corey Schafer)', 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM', 'video', 'working', 15),
  ('linear-algebra', 'Essence of Linear Algebra (3Blue1Brown, full series)', 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', 'video', 'working', NULL),
  ('linear-algebra', 'Vectors, what even are they? (3Blue1Brown, ch.1)', 'https://www.youtube.com/watch?v=fNk_zzaMoSs', 'video', 'working', 10),
  ('linear-algebra', 'Eigenvectors and eigenvalues (3Blue1Brown, ch.14)', 'https://www.youtube.com/watch?v=PFDu9oVAE-g', 'video', 'working', 17),
  ('probability-stats', 'Statistics Fundamentals (StatQuest, full series)', 'https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9', 'video', 'working', NULL),
  ('probability-stats', 'The Main Ideas behind Probability Distributions (StatQuest)', 'https://www.youtube.com/watch?v=oI3hZJqXJuc', 'video', 'working', 5),
  ('probability-stats', 'Probability is not Likelihood (StatQuest)', 'https://www.youtube.com/watch?v=pYxNSUDSFH4', 'video', 'working', 5),
  ('calculus-optimization', 'Visualizing the chain rule and product rule (3Blue1Brown, ch.4)', 'https://www.youtube.com/watch?v=YG15m2VwSjA', 'video', 'working', 12),
  ('calculus-optimization', 'The paradox of the derivative (3Blue1Brown, ch.2)', 'https://www.youtube.com/watch?v=9vKqVkMQHKk', 'video', 'working', 17),

  -- Classical ML
  ('supervised-learning', 'Machine Learning Fundamentals: Bias and Variance (StatQuest)', 'https://www.youtube.com/watch?v=EuBBz3bI-aA', 'video', 'working', 7),
  ('model-evaluation', 'ROC and AUC, Clearly Explained! (StatQuest)', 'https://www.youtube.com/watch?v=4jRBRDbJemM', 'video', 'working', 16),
  ('xgboost-trees', 'Gradient Boost Part 1: Regression Main Ideas (StatQuest)', 'https://www.youtube.com/watch?v=3CC4N4z3GJc', 'video', 'working', 15),
  ('xgboost-trees', 'XGBoost Part 1: Regression (StatQuest)', 'https://www.youtube.com/watch?v=OtD8wVaFm6E', 'video', 'working', 25),
  ('shap-explainability', 'SHAP Values for Beginners — What They Mean', 'https://www.youtube.com/watch?v=MQ6fFDwjuco', 'video', 'working', 20),

  -- Deep Learning
  ('neural-networks-mlp', 'But what is a Neural Network? (3Blue1Brown, ch.1)', 'https://www.youtube.com/watch?v=aircAruvnKk', 'video', 'working', 19),
  ('pytorch-basics', 'PyTorch for Deep Learning & Machine Learning — Full Course (freeCodeCamp)', 'https://www.youtube.com/watch?v=V_xro1bcAuA', 'video', 'working', NULL),
  ('autograd-backprop', 'What is backpropagation really doing? (3Blue1Brown, ch.3)', 'https://www.youtube.com/watch?v=Ilg3gGewQ5U', 'video', 'working', 14),
  ('autograd-backprop', 'Backpropagation calculus (3Blue1Brown, ch.4)', 'https://www.youtube.com/watch?v=tIeHLnjs5U8', 'video', 'working', 10),
  ('training-dynamics', 'Gradient descent, how neural networks learn (3Blue1Brown, ch.2)', 'https://www.youtube.com/watch?v=IHZwWFHWa-w', 'video', 'working', 20),
  ('regularization', 'Regularization Part 1: Ridge (L2) Regression (StatQuest)', 'https://www.youtube.com/watch?v=Q81RR3yKn30', 'video', 'working', 20),
  ('regularization', 'Ridge vs Lasso Regression, Visualized (StatQuest)', 'https://www.youtube.com/watch?v=Xm2C_gTAl8c', 'video', 'working', 9),

  -- Transformers
  ('embeddings-tokenization', 'Let''s build the GPT Tokenizer (Andrej Karpathy)', 'https://www.youtube.com/watch?v=zduSFxRajkE', 'video', 'working', NULL),
  ('self-attention', 'Let''s build GPT: from scratch, in code, spelled out (Andrej Karpathy)', 'https://www.youtube.com/watch?v=kCc8FmEb1nY', 'video', 'working', NULL),
  ('self-attention', 'Attention in transformers, visually explained (3Blue1Brown, ch.6)', 'https://www.youtube.com/watch?v=eMlx5fFNoYc', 'video', 'working', 26),
  ('multi-head-attention', 'Attention in transformers, visually explained (3Blue1Brown, ch.6)', 'https://www.youtube.com/watch?v=eMlx5fFNoYc', 'video', 'working', 26),
  ('transformer-block', 'But what is a GPT? Visual intro to transformers (3Blue1Brown, ch.5)', 'https://www.youtube.com/watch?v=wjZofJX0v4M', 'video', 'working', 27),

  -- LLMs
  ('llm-mental-model', 'Deep Dive into LLMs like ChatGPT (Andrej Karpathy)', 'https://www.youtube.com/watch?v=7xTGNNLPyMI', 'video', 'working', NULL),
  ('prompt-engineering', 'ChatGPT Prompt Engineering for Developers (OpenAI + DeepLearning.AI)', 'https://www.youtube.com/watch?v=H4YK_7MAckk', 'video', 'working', 60),
  ('pretraining-objectives', 'Let''s reproduce GPT-2 (124M) (Andrej Karpathy)', 'https://www.youtube.com/watch?v=l8pRSuU81PU', 'video', 'working', NULL),
  ('fine-tuning-lora', 'What is LoRA? Low-Rank Adaptation for finetuning LLMs, Explained', 'https://www.youtube.com/watch?v=KEv-F5UkhxU', 'video', 'working', 18),
  ('fine-tuning-lora', 'Fine-tuning LLMs with PEFT and LoRA', 'https://www.youtube.com/watch?v=Us5ZFp16PaU', 'video', 'working', 25),
  ('evaluation-llms', 'A Deep Dive on LLM Evaluation', 'https://www.youtube.com/watch?v=IsZVCnViwhk', 'video', 'working', 30),
  ('rlhf-alignment', 'Reinforcement Learning with Human Feedback (RLHF), Clearly Explained (StatQuest)', 'https://www.youtube.com/watch?v=qPN_XZcJf_s', 'video', 'working', 15),

  -- RAG & Agents
  ('vector-databases', 'How Vector Databases Search at Scale — HNSW Explained Simply', 'https://www.youtube.com/watch?v=c8e5aJBnjeg', 'video', 'working', NULL),
  ('vector-databases', 'Embeddings & Vector Databases Explained', 'https://www.youtube.com/watch?v=rw1YfQQttfo', 'video', 'working', NULL),
  ('rag-engineering', 'Learn RAG From Scratch — Python AI Tutorial from a LangChain Engineer', 'https://www.youtube.com/watch?v=sVcwVQRHIc8', 'video', 'working', NULL),
  ('rag-engineering', 'What is RAG? Retrieval-Augmented Generation Explained (IBM)', 'https://www.youtube.com/watch?v=T-D1OfcDW1M', 'video', 'working', NULL),
  ('document-chunking', 'Learn RAG From Scratch — chunking & indexing walkthrough (LangChain)', 'https://www.youtube.com/watch?v=sVcwVQRHIc8', 'video', 'working', NULL),
  ('agent-architectures', '5 Levels of AI Agents — from Simple LLM Calls to Multi-Agent Systems', 'https://www.youtube.com/watch?v=BaXTos7B1vY', 'video', 'working', NULL),
  ('agent-loops', '5 Levels of AI Agents — from Simple LLM Calls to Multi-Agent Systems', 'https://www.youtube.com/watch?v=BaXTos7B1vY', 'video', 'working', NULL),
  ('multi-agent-systems', 'Multi-Agent Systems Explained: How AI Agents & LLMs Work Together', 'https://www.youtube.com/watch?v=sWH0T4Zez6I', 'video', 'working', NULL),
  ('mcp-protocol', 'Model Context Protocol (MCP) Explained in 20 Minutes', 'https://www.youtube.com/watch?v=N3vHJcHBS-w', 'video', 'working', 20),
  ('mcp-protocol', 'Model Context Protocol (MCP), Clearly Explained (Why It Matters)', 'https://www.youtube.com/watch?v=7j_NE6Pjv-E', 'video', 'working', NULL),

  -- Evaluation & Quality
  ('eval-criteria', 'How to Systematically Setup LLM Evals (Metrics, Unit Tests, LLM-as-a-Judge)', 'https://www.youtube.com/watch?v=a3SMraZWNNs', 'video', 'working', 30),
  ('llm-as-judge', 'How to Systematically Setup LLM Evals (Metrics, Unit Tests, LLM-as-a-Judge)', 'https://www.youtube.com/watch?v=a3SMraZWNNs', 'video', 'working', 30)
ON CONFLICT DO NOTHING;
