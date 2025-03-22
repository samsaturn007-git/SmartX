-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "video_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follower" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "follower_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "video_user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "chat_user_id" TEXT NOT NULL,
    "users_key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "video_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostVote" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vote_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PostVote_post_id_user_id_key" ON "PostVote"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follower" ADD CONSTRAINT "Follower_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security for all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Video" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Follower" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Chat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PostVote" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
CREATE POLICY "Allow public read access to users" ON "User"
    FOR SELECT
    USING (true);

CREATE POLICY "Allow users to update their own profile" ON "User"
    FOR UPDATE
    USING (auth.uid()::uuid = id);

CREATE POLICY "Allow authenticated users to create their profile" ON "User"
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = id);

-- Create policies for Video table
CREATE POLICY "Allow public read access to videos" ON "Video"
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to create videos" ON "Video"
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

-- Create policies for Post table
CREATE POLICY "Allow public read access to posts" ON "Post"
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to create posts" ON "Post"
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Allow users to update their own posts" ON "Post"
    FOR UPDATE
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Allow users to delete their own posts" ON "Post"
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Create policies for PostVote table
CREATE POLICY "Allow public read access to post votes" ON "PostVote"
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to vote" ON "PostVote"
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Allow users to change their votes" ON "PostVote"
    FOR UPDATE
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Allow users to remove their votes" ON "PostVote"
    FOR DELETE
    USING (auth.uid()::uuid = user_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant necessary permissions to anon users (for public read access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON "User", "Video", "Post", "PostVote" TO anon;

-- Allow service_role to bypass RLS
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Video" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Like" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Follower" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Comment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Chat" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Report" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Post" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PostVote" FORCE ROW LEVEL SECURITY;

-- Create policy for service_role to bypass RLS
CREATE POLICY "service_role bypass RLS" ON "User" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Video" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Like" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Follower" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Comment" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Chat" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Report" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "Post" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role bypass RLS" ON "PostVote" FOR ALL USING (true) WITH CHECK (true);
