// components/PostViewer.tsx
import React from "react";

interface PostData {
  hours: number;
  text: string;
  tweet_id: number;
}

interface PostViewerProps {
  data: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export const PostViewer: React.FC<PostViewerProps> = ({ data, loading, selectedStock }) => {
  const handlePostClick = (tweetId: number) => {
    const url = `https://x.com/post/status/${tweetId}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mt-6 PostViewer" key={selectedStock || "no-stock"}>
      <div className="container-header">
        Post Viewer {loading ? "(Loading...)" : ""}
      </div>
      <div className="container-content">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800">
              <th className="border border-gray-700 p-1 text-center">Hours Ago</th>
              <th className="border border-gray-700 p-1 text-center">Post</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="border border-gray-700 p-4 text-center">
                  Loading posts...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((post, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-800 cursor-pointer"
                  onClick={() => handlePostClick(post.tweet_id)}
                >
                  <td className="border border-gray-700 p-1 text-center">{post.hours.toFixed(1)}</td>
                  <td className="border border-gray-700 p-1 text-left">{post.text}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="border border-gray-700 p-4 text-center">
                  No posts available for {selectedStock || "selected stock"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};