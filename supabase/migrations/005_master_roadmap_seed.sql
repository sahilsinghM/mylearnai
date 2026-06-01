-- Seed: 33 master roadmap nodes
INSERT INTO master_roadmap_nodes
  (id, title, blurb, phase, row_index, difficulty,
   hours_awareness, hours_working, hours_fluent, hours_expert,
   relevance_fintech, relevance_research, relevance_mlops, relevance_dev_tools, relevance_education_ai,
   skip_for_levels,
   depth_awareness, depth_working, depth_fluent, depth_expert)
VALUES
  -- Phase 1 — Foundations
  ('python-proficiency', 'Python Proficiency',
   'List comprehensions, decorators, async, typing, packaging. Not ''what is a variable''.',
   1, 0, 1, 1, 8, 24, 60, 0.9, 0.85, 0.95, 1.0, 0.85,
   ARRAY['senior','staff'],
   NULL, NULL, NULL, NULL),

  ('linear-algebra', 'Linear Algebra',
   'Vectors, matrices, eigendecomposition, SVD. The math that shows up in every model.',
   1, 1, 3, 2, 12, 30, 80, 0.6, 0.95, 0.55, 0.5, 0.7,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('probability-stats', 'Probability & Statistics',
   'Distributions, expectation, Bayes, hypothesis testing. The grammar of uncertainty.',
   1, 2, 3, 2, 14, 36, 90, 0.95, 0.95, 0.6, 0.55, 0.7,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('calculus-optimization', 'Calculus & Optimization',
   'Gradients, chain rule, convexity, SGD. The engine room of training.',
   1, 3, 3, 2, 10, 26, 70, 0.55, 0.95, 0.55, 0.45, 0.65,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 2 — Classical ML
  ('supervised-learning', 'Supervised Learning',
   'Bias–variance, train/val/test, the standard ML pipeline.',
   2, 0, 2, 1, 8, 22, 55, 0.95, 0.9, 0.85, 0.75, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('feature-engineering', 'Feature Engineering',
   'Encoding, scaling, leakage. Where most of the signal hides.',
   2, 1, 2, 1, 6, 18, 40, 1.0, 0.55, 0.85, 0.6, 0.6,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('model-evaluation', 'Model Evaluation',
   'Precision/recall, ROC, calibration. Knowing if your model is actually good.',
   2, 2, 2, 1, 6, 18, 40, 0.95, 0.85, 0.9, 0.75, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('xgboost-trees', 'Gradient-Boosted Trees',
   'Decision trees, boosting, XGBoost — what still wins most tabular problems.',
   2, 3, 2, 1, 6, 16, 40, 1.0, 0.5, 0.75, 0.55, 0.45,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('shap-explainability', 'Explainability & SHAP',
   'Feature attribution. Required wherever decisions need to be defended.',
   2, 4, 2, 1, 5, 14, 32, 1.0, 0.55, 0.75, 0.45, 0.5,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 3 — Deep Learning
  ('neural-networks-mlp', 'Neural Networks & MLPs',
   'MLPs, activations, loss landscapes. The base case of every deep network.',
   3, 0, 3, 1, 8, 22, 55, 0.7, 0.95, 0.7, 0.7, 0.8,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('pytorch-basics', 'PyTorch',
   'Tensors, modules, optimizers, training loops you can read end-to-end.',
   3, 1, 2, 1, 8, 22, 50, 0.75, 0.95, 0.85, 0.8, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('autograd-backprop', 'Autograd & Backprop',
   'Reverse-mode differentiation. How every modern model actually learns.',
   3, 2, 4, 1, 8, 22, 50, 0.55, 0.95, 0.6, 0.55, 0.85,
   ARRAY[]::TEXT[],
   'Understand that backprop computes gradients via the chain rule, automated by a computation graph.',
   'Read a PyTorch training loop and explain every line. Spot a missing .zero_grad(). Debug exploding gradients.',
   'Implement autograd from scratch for scalars and small tensors. Reason about memory in the backward pass.',
   'Implement reverse-mode AD on arbitrary computation graphs. Write custom autograd.Function for novel ops.'),

  ('training-dynamics', 'Training Dynamics',
   'Init, normalisation, learning rates, schedulers. Why training works or doesn''t.',
   3, 3, 4, 1, 7, 20, 50, 0.55, 0.95, 0.75, 0.55, 0.7,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('regularization', 'Regularisation',
   'Dropout, weight decay, early stopping. Generalisation, not memorisation.',
   3, 4, 2, 1, 5, 14, 30, 0.7, 0.85, 0.75, 0.6, 0.7,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 4 — Transformers
  ('embeddings-tokenization', 'Embeddings & Tokenization',
   'BPE, vocab, embedding spaces. The mouth of every language model.',
   4, 0, 2, 1, 6, 18, 40, 0.75, 0.9, 0.8, 0.8, 0.75,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('self-attention', 'Self-Attention',
   'Q, K, V. The core operation behind every transformer.',
   4, 1, 4, 1, 8, 22, 55, 0.6, 1.0, 0.65, 0.7, 0.85,
   ARRAY[]::TEXT[],
   'Know that attention weights tokens by relevance to each other and that this replaced RNNs for sequence modelling.',
   'Implement scaled dot-product attention from a vector of Q, K, V. Debug shapes. Know why we divide by √d_k.',
   'Derive attention from first principles. Reason about its O(n²) cost. Understand variants (sparse, flash, linear).',
   'Read attention-related papers as they drop. Have opinions about long-context strategies. Could co-author one.'),

  ('positional-encoding', 'Positional Encoding',
   'How a permutation-invariant operation learns sequence order.',
   4, 2, 3, 0.5, 4, 12, 28, 0.45, 0.95, 0.55, 0.5, 0.7,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('multi-head-attention', 'Multi-Head Attention',
   'Parallel attention heads. Why models can track many things at once.',
   4, 3, 4, 1, 6, 16, 40, 0.55, 0.95, 0.6, 0.65, 0.8,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('transformer-block', 'The Transformer Block',
   'Attention + FFN + residuals + norms. The unit you stack to make GPT.',
   4, 4, 4, 1, 8, 22, 55, 0.55, 1.0, 0.65, 0.7, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 5 — LLMs
  ('prompt-engineering', 'Prompt Engineering',
   'Few-shot, chain-of-thought, role conditioning. The interface to capability.',
   5, 0, 1, 1, 6, 14, 28, 0.85, 0.6, 0.8, 0.95, 0.9,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('pretraining-objectives', 'Pretraining Objectives',
   'Next-token prediction, masked LM. What ''training'' an LLM actually means.',
   5, 1, 3, 1, 6, 18, 45, 0.4, 1.0, 0.55, 0.4, 0.75,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('fine-tuning-lora', 'Fine-tuning & LoRA',
   'Parameter-efficient adaptation. Specialising a foundation model on a budget.',
   5, 2, 3, 1, 10, 26, 60, 0.85, 0.9, 0.9, 0.85, 0.85,
   ARRAY[]::TEXT[],
   'Know fine-tuning teaches a foundation model your style/task without retraining from scratch.',
   'Fine-tune with LoRA on a small dataset. Build train/eval splits. Measure improvement honestly.',
   'Choose between SFT, DPO, full fine-tune. Curate data deliberately. Avoid catastrophic forgetting.',
   'Design preference datasets and reward models. Run RLHF end-to-end. Publish.'),

  ('evaluation-llms', 'Evaluating LLMs',
   'Benchmarks lie. Building real evals for your task.',
   5, 3, 3, 1, 8, 20, 50, 0.95, 0.9, 0.95, 0.85, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('rlhf-alignment', 'RLHF & Alignment',
   'Preference learning, reward models, PPO/DPO. How models learn what we want.',
   5, 4, 5, 1, 6, 18, 60, 0.3, 1.0, 0.45, 0.35, 0.75,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 6 — Agents & RAG
  ('vector-databases', 'Vector Databases',
   'Embeddings, ANN search, hybrid retrieval. The data layer of every RAG app.',
   6, 0, 2, 1, 6, 14, 32, 0.85, 0.55, 0.95, 0.95, 0.85,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('rag-engineering', 'RAG Engineering',
   'Retrieval, reranking, context windows. Grounding models in your data.',
   6, 1, 3, 1, 10, 24, 50, 0.95, 0.65, 0.9, 0.95, 0.95,
   ARRAY[]::TEXT[],
   'Know RAG augments an LLM with retrieved context, and that retrieval quality is usually the bottleneck.',
   'Build a RAG pipeline: chunk, embed, retrieve, rerank, prompt. Measure recall@k. Ship to users.',
   'Tune hybrid retrieval, deal with multi-hop questions, evaluate end-to-end, handle long contexts intelligently.',
   'Design retrieval systems for adversarial, multi-tenant, or regulated environments. Push the frontier of evals.'),

  ('agent-architectures', 'Agent Architectures',
   'ReAct, planning, memory. Loops, not single calls.',
   6, 2, 4, 1, 10, 24, 55, 0.75, 0.8, 0.85, 0.95, 0.8,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('tool-use-function-calling', 'Tool Use & Function Calling',
   'Structured calls, tool routing, JSON schemas. The hands of the agent.',
   6, 3, 2, 1, 6, 14, 32, 0.85, 0.55, 0.85, 0.95, 0.8,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('multi-agent-systems', 'Multi-Agent Systems',
   'Coordination, role specialisation, emergent failure modes.',
   6, 4, 4, 1, 8, 18, 45, 0.55, 0.85, 0.7, 0.85, 0.6,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  -- Phase 7 — Production
  ('model-serving', 'Model Serving',
   'Inference servers, batching, quantisation. Latency that doesn''t kill UX.',
   7, 0, 3, 1, 8, 20, 45, 0.85, 0.4, 1.0, 0.75, 0.55,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('observability-monitoring', 'Observability',
   'Traces, evals in prod, drift. Knowing when the model gets worse.',
   7, 1, 3, 1, 6, 16, 36, 0.95, 0.5, 1.0, 0.85, 0.6,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('cost-optimization', 'Cost Optimisation',
   'Caching, model routing, distillation. Margins matter.',
   7, 2, 3, 0.5, 4, 12, 28, 0.95, 0.4, 0.95, 0.85, 0.5,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL),

  ('safety-guardrails', 'Safety & Guardrails',
   'Input/output filtering, jailbreak detection. The boring last 5% that matters most.',
   7, 3, 3, 1, 6, 16, 40, 1.0, 0.75, 0.9, 0.8, 0.8,
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, NULL)

ON CONFLICT (id) DO NOTHING;


-- Seed: 50 dependency edges
INSERT INTO master_roadmap_edges (from_node_id, to_node_id, edge_type)
VALUES
  -- From Phase 1
  ('python-proficiency',    'supervised-learning',     'required'),
  ('python-proficiency',    'pytorch-basics',          'required'),
  ('linear-algebra',        'neural-networks-mlp',     'required'),
  ('linear-algebra',        'self-attention',          'required'),
  ('linear-algebra',        'autograd-backprop',       'recommended'),
  ('probability-stats',     'supervised-learning',     'required'),
  ('probability-stats',     'model-evaluation',        'required'),
  ('probability-stats',     'evaluation-llms',         'recommended'),
  ('calculus-optimization', 'autograd-backprop',       'required'),
  ('calculus-optimization', 'training-dynamics',       'required'),

  -- Phase 2 internal + outward
  ('supervised-learning',   'feature-engineering',     'required'),
  ('supervised-learning',   'model-evaluation',        'required'),
  ('supervised-learning',   'xgboost-trees',           'required'),
  ('supervised-learning',   'neural-networks-mlp',     'required'),
  ('model-evaluation',      'evaluation-llms',         'recommended'),
  ('xgboost-trees',         'shap-explainability',     'required'),

  -- Phase 3 internal + outward
  ('neural-networks-mlp',   'autograd-backprop',       'required'),
  ('neural-networks-mlp',   'pytorch-basics',          'recommended'),
  ('pytorch-basics',        'embeddings-tokenization', 'required'),
  ('pytorch-basics',        'transformer-block',       'required'),
  ('pytorch-basics',        'fine-tuning-lora',        'required'),
  ('autograd-backprop',     'training-dynamics',       'required'),
  ('training-dynamics',     'regularization',          'required'),
  ('regularization',        'fine-tuning-lora',        'recommended'),

  -- Phase 4 internal + outward
  ('embeddings-tokenization','self-attention',         'required'),
  ('self-attention',         'multi-head-attention',   'required'),
  ('self-attention',         'positional-encoding',    'required'),
  ('multi-head-attention',   'transformer-block',      'required'),
  ('positional-encoding',    'transformer-block',      'required'),
  ('transformer-block',      'pretraining-objectives', 'required'),
  ('transformer-block',      'fine-tuning-lora',       'required'),

  -- Phase 5 internal + outward
  ('pretraining-objectives', 'fine-tuning-lora',       'recommended'),
  ('pretraining-objectives', 'rlhf-alignment',         'required'),
  ('fine-tuning-lora',       'rlhf-alignment',         'required'),
  ('fine-tuning-lora',       'evaluation-llms',        'required'),
  ('prompt-engineering',     'rag-engineering',        'required'),
  ('prompt-engineering',     'agent-architectures',    'required'),
  ('evaluation-llms',        'observability-monitoring','recommended'),

  -- Phase 6 internal + outward
  ('embeddings-tokenization','vector-databases',       'recommended'),
  ('vector-databases',       'rag-engineering',        'required'),
  ('rag-engineering',        'agent-architectures',    'required'),
  ('agent-architectures',    'tool-use-function-calling','required'),
  ('tool-use-function-calling','multi-agent-systems',  'required'),
  ('agent-architectures',    'multi-agent-systems',    'required'),
  ('agent-architectures',    'safety-guardrails',      'recommended'),

  -- Phase 7
  ('fine-tuning-lora',       'model-serving',          'required'),
  ('model-serving',          'observability-monitoring','required'),
  ('model-serving',          'cost-optimization',      'required'),
  ('rlhf-alignment',         'safety-guardrails',      'required'),
  ('rag-engineering',        'observability-monitoring','recommended')

ON CONFLICT (from_node_id, to_node_id) DO NOTHING;


-- Seed: one curated starting resource per node
INSERT INTO master_roadmap_resources
  (node_id, title, url, resource_type, depth_level, estimated_minutes)
VALUES
  ('python-proficiency', 'The Python Tutorial', 'https://docs.python.org/3/tutorial/', 'docs', 'working', 120),
  ('linear-algebra', 'Essence of Linear Algebra', 'https://www.3blue1brown.com/topics/linear-algebra', 'video', 'working', 180),
  ('probability-stats', 'Seeing Theory', 'https://seeing-theory.brown.edu/', 'blog', 'working', 120),
  ('calculus-optimization', 'Gradient Descent, Step-by-Step', 'https://www.youtube.com/watch?v=sDv4f4s2SB8', 'video', 'working', 30),
  ('supervised-learning', 'Machine Learning Specialization', 'https://www.coursera.org/specializations/machine-learning-introduction', 'video', 'working', 180),
  ('feature-engineering', 'Feature Engineering for Machine Learning', 'https://developers.google.com/machine-learning/crash-course/categorical-data', 'docs', 'working', 60),
  ('model-evaluation', 'Classification: Accuracy, Recall, Precision', 'https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall', 'docs', 'working', 45),
  ('xgboost-trees', 'Introduction to Boosted Trees', 'https://xgboost.readthedocs.io/en/stable/tutorials/model.html', 'docs', 'working', 60),
  ('shap-explainability', 'SHAP Documentation', 'https://shap.readthedocs.io/en/latest/', 'docs', 'working', 60),
  ('neural-networks-mlp', 'Neural Networks', 'https://www.3blue1brown.com/topics/neural-networks', 'video', 'working', 120),
  ('pytorch-basics', 'PyTorch Quickstart', 'https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html', 'docs', 'working', 60),
  ('autograd-backprop', 'A Micrograd Walkthrough', 'https://github.com/karpathy/micrograd', 'docs', 'working', 90),
  ('training-dynamics', 'A Recipe for Training Neural Networks', 'https://karpathy.github.io/2019/04/25/recipe/', 'blog', 'working', 45),
  ('regularization', 'Regularization for Simplicity', 'https://developers.google.com/machine-learning/crash-course/overfitting/regularization', 'docs', 'working', 45),
  ('embeddings-tokenization', 'Summary of the Tokenizers', 'https://huggingface.co/docs/transformers/tokenizer_summary', 'docs', 'working', 60),
  ('self-attention', 'The Illustrated Transformer', 'https://jalammar.github.io/illustrated-transformer/', 'blog', 'working', 60),
  ('positional-encoding', 'The Annotated Transformer', 'https://nlp.seas.harvard.edu/annotated-transformer/', 'blog', 'working', 75),
  ('multi-head-attention', 'MultiheadAttention', 'https://docs.pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html', 'docs', 'working', 45),
  ('transformer-block', 'The Annotated Transformer', 'https://nlp.seas.harvard.edu/annotated-transformer/', 'blog', 'working', 120),
  ('prompt-engineering', 'Prompt Engineering Guide', 'https://platform.openai.com/docs/guides/prompt-engineering', 'docs', 'working', 60),
  ('pretraining-objectives', 'Language Modeling', 'https://huggingface.co/docs/course/en/chapter7/6', 'docs', 'working', 75),
  ('fine-tuning-lora', 'PEFT LoRA Guide', 'https://huggingface.co/docs/peft/main/en/task_guides/lora_based_methods', 'docs', 'working', 90),
  ('evaluation-llms', 'OpenAI Evals Design Guide', 'https://platform.openai.com/docs/guides/evals', 'docs', 'working', 90),
  ('rlhf-alignment', 'Illustrating Reinforcement Learning from Human Feedback', 'https://huggingface.co/blog/rlhf', 'blog', 'working', 90),
  ('vector-databases', 'FAISS Getting Started', 'https://github.com/facebookresearch/faiss/wiki/Getting-started', 'docs', 'working', 60),
  ('rag-engineering', 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'https://arxiv.org/abs/2005.11401', 'paper', 'working', 90),
  ('agent-architectures', 'ReAct: Synergizing Reasoning and Acting', 'https://arxiv.org/abs/2210.03629', 'paper', 'working', 75),
  ('tool-use-function-calling', 'Function Calling Guide', 'https://platform.openai.com/docs/guides/function-calling', 'docs', 'working', 60),
  ('multi-agent-systems', 'AutoGen: Enabling Next-Gen LLM Applications', 'https://arxiv.org/abs/2308.08155', 'paper', 'working', 75),
  ('model-serving', 'vLLM Documentation', 'https://docs.vllm.ai/en/latest/', 'docs', 'working', 90),
  ('observability-monitoring', 'OpenTelemetry Concepts', 'https://opentelemetry.io/docs/concepts/', 'docs', 'working', 60),
  ('cost-optimization', 'Latency Optimization Guide', 'https://platform.openai.com/docs/guides/latency-optimization', 'docs', 'working', 45),
  ('safety-guardrails', 'Safety Best Practices', 'https://platform.openai.com/docs/guides/safety-best-practices', 'docs', 'working', 60)
ON CONFLICT DO NOTHING;


-- Seed: one runnable working-depth proof project per node
INSERT INTO master_roadmap_projects
  (node_id, title, description, depth_level, deliverable, estimated_hours)
VALUES
  ('python-proficiency', 'Package an async data collector', 'Build a typed Python package that concurrently fetches, validates, and stores API records.', 'working', 'Installable package with tests and a CLI entry point.', 6),
  ('linear-algebra', 'Implement matrix decompositions', 'Implement vector projection and compare a compact SVD reconstruction against NumPy.', 'working', 'Notebook with numerical checks and reconstruction-error output.', 6),
  ('probability-stats', 'Build a Bayesian A/B simulator', 'Simulate conversion experiments and report posterior probabilities for competing variants.', 'working', 'Runnable script with reproducible plots and decision output.', 6),
  ('calculus-optimization', 'Visualize gradient descent', 'Implement gradient descent for several objectives and inspect convergence under different learning rates.', 'working', 'Script that exports loss-curve plots for stable and unstable runs.', 5),
  ('supervised-learning', 'Train a baseline classifier', 'Train, validate, and compare two supervised classifiers on a public tabular dataset.', 'working', 'Notebook with split strategy, metrics table, and saved model.', 6),
  ('feature-engineering', 'Detect leakage in a tabular pipeline', 'Build a preprocessing pipeline, inject a leaking feature, and demonstrate the metric distortion.', 'working', 'Notebook with before-and-after validation metrics.', 5),
  ('model-evaluation', 'Create a threshold analysis report', 'Evaluate a binary classifier across thresholds with precision, recall, ROC, and calibration.', 'working', 'Generated report with plots and a justified threshold choice.', 5),
  ('xgboost-trees', 'Benchmark boosted trees', 'Train an XGBoost model and compare it against a linear baseline on tabular data.', 'working', 'Reproducible benchmark with metrics and training configuration.', 6),
  ('shap-explainability', 'Explain a credit-risk model', 'Use SHAP to explain global behavior and individual decisions from a tree model.', 'working', 'Notebook with summary plot and three local explanations.', 6),
  ('neural-networks-mlp', 'Train an MLP from scratch', 'Implement a small multilayer perceptron and train it on a classification dataset.', 'working', 'Training script with loss curve and held-out accuracy.', 8),
  ('pytorch-basics', 'Write a complete PyTorch training loop', 'Build a dataset, model, optimizer, evaluation pass, checkpoint, and reload path.', 'working', 'Runnable training script and restored-model evaluation.', 6),
  ('autograd-backprop', 'Build scalar autograd', 'Implement a scalar computation graph with reverse-mode differentiation.', 'working', 'Tested micrograd-style engine with gradient checks.', 8),
  ('training-dynamics', 'Diagnose an unstable training run', 'Run controlled experiments with learning rates, initialization, and gradient clipping.', 'working', 'Comparison report with loss curves and a diagnosed failure mode.', 8),
  ('regularization', 'Measure generalization controls', 'Compare dropout, weight decay, and early stopping on the same network.', 'working', 'Experiment table and plots showing validation behavior.', 6),
  ('embeddings-tokenization', 'Compare tokenization tradeoffs', 'Train or configure multiple tokenizers and measure sequence lengths across a corpus.', 'working', 'Script with vocabulary, compression, and edge-case report.', 6),
  ('self-attention', 'Implement scaled dot-product attention', 'Build attention from Q, K, and V tensors and verify masking and shape behavior.', 'working', 'Tested implementation with attention-weight visualization.', 6),
  ('positional-encoding', 'Compare position strategies', 'Add sinusoidal and learned positional encodings to a tiny sequence model.', 'working', 'Experiment with output comparison and plotted encodings.', 6),
  ('multi-head-attention', 'Build multi-head attention', 'Implement head splitting, parallel attention, concatenation, and output projection.', 'working', 'Tested module with shape checks and attention maps.', 8),
  ('transformer-block', 'Assemble a transformer block', 'Combine attention, feed-forward layers, residuals, normalization, and masking.', 'working', 'Tested PyTorch block with an end-to-end forward pass.', 8),
  ('prompt-engineering', 'Build a prompt regression suite', 'Define prompt variants and evaluate them against a fixed set of examples.', 'working', 'Versioned prompt set with an evaluation report.', 5),
  ('pretraining-objectives', 'Train a tiny next-token model', 'Create a small corpus pipeline and train a language model objective end to end.', 'working', 'Training script with loss curve and generated samples.', 10),
  ('fine-tuning-lora', 'Fine-tune with LoRA', 'Apply LoRA to a small language model and compare task performance before and after.', 'working', 'Adapter weights, training config, and evaluation report.', 10),
  ('evaluation-llms', 'Build a task-specific LLM eval', 'Design a dataset, rubric, automated scorer, and human spot-check workflow.', 'working', 'Runnable eval harness with a baseline report.', 8),
  ('rlhf-alignment', 'Compare preference objectives', 'Create a tiny preference dataset and compare a direct preference objective against supervised tuning.', 'working', 'Experiment notes, dataset, and metric comparison.', 10),
  ('vector-databases', 'Build vector search from scratch', 'Index embeddings and return nearest neighbors with a measured recall and latency report.', 'working', 'Runnable search API with benchmark output.', 8),
  ('rag-engineering', 'Build and evaluate a RAG pipeline', 'Chunk, embed, retrieve, rerank, and answer against a small document corpus.', 'working', 'Runnable pipeline with recall@k and answer-quality examples.', 10),
  ('agent-architectures', 'Implement a ReAct agent loop', 'Build a bounded agent loop that reasons, invokes tools, and records each step.', 'working', 'Runnable agent with trace logs and failure-case tests.', 8),
  ('tool-use-function-calling', 'Build a schema-driven tool router', 'Validate structured model calls and dispatch them to typed application tools.', 'working', 'Tool router with validation tests and malformed-call handling.', 6),
  ('multi-agent-systems', 'Compare single-agent and multi-agent execution', 'Implement a small coordinator and measure when role specialization helps or hurts.', 'working', 'Trace comparison with latency, quality, and failure notes.', 10),
  ('model-serving', 'Serve and benchmark a model', 'Expose a model behind an inference endpoint and measure batching and latency behavior.', 'working', 'Service with load-test report and p50/p95 latency.', 8),
  ('observability-monitoring', 'Instrument an LLM pipeline', 'Add traces, token metrics, latency metrics, and failure tagging to an LLM workflow.', 'working', 'Observable service with example traces and dashboard screenshots.', 6),
  ('cost-optimization', 'Measure and reduce inference cost', 'Benchmark caching and model-routing strategies against a fixed request workload.', 'working', 'Cost report with baseline and optimized configurations.', 6),
  ('safety-guardrails', 'Red-team an AI endpoint', 'Create adversarial inputs, add input and output controls, and measure blocked failures.', 'working', 'Runnable test suite with before-and-after safety results.', 8)
ON CONFLICT DO NOTHING;
