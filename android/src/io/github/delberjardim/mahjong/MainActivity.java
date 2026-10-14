package io.github.delberjardim.mahjong;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Native Android launcher for the same HTTPS game and its offline service worker. */
public final class MainActivity extends Activity {
    private static final String GAME_URL = "https://delberjardim.github.io/mahjong/index.html?app=android";
    private WebView game;
    private View connectionMessage;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(11, 58, 31));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });

        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(11, 58, 31));
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        game.setWebChromeClient(new WebChromeClient());
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isGameUrl(uri)) return false;
                if ("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException error) {
                        Toast.makeText(MainActivity.this, "Não foi possível abrir esse link.", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                connectionMessage.setVisibility(View.GONE);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) connectionMessage.setVisibility(View.VISIBLE);
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 400) connectionMessage.setVisibility(View.VISIBLE);
            }
        });
        root.addView(game, new FrameLayout.LayoutParams(-1, -1));
        connectionMessage = makeConnectionMessage();
        root.addView(connectionMessage, new FrameLayout.LayoutParams(-1, -1));
        connectionMessage.setVisibility(View.GONE);
        setContentView(root);
        root.requestApplyInsets();
        if (state == null || game.restoreState(state) == null) game.loadUrl(GAME_URL);
    }

    private static boolean isGameUrl(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme())
            && "delberjardim.github.io".equalsIgnoreCase(uri.getHost())
            && uri.getPath() != null && uri.getPath().startsWith("/mahjong/");
    }

    private View makeConnectionMessage() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setBackgroundColor(Color.rgb(11, 58, 31));
        int padding = (int) (24 * getResources().getDisplayMetrics().density);
        panel.setPadding(padding, padding, padding, padding);
        TextView text = new TextView(this);
        text.setText("Conecte-se à internet para abrir o jogo.\n\nDepois de carregar, o jogo fica disponível offline.");
        text.setTextColor(Color.rgb(243, 246, 242));
        text.setTextSize(18);
        text.setGravity(Gravity.CENTER);
        panel.addView(text);
        Button retry = new Button(this);
        retry.setText("Tentar novamente");
        retry.setOnClickListener(view -> game.loadUrl(GAME_URL));
        LinearLayout.LayoutParams buttonLayout = new LinearLayout.LayoutParams(-2, -2);
        buttonLayout.topMargin = padding;
        panel.addView(retry, buttonLayout);
        return panel;
    }

    @Override protected void onPause() {
        // Android backgrounding does not trigger the page's beforeunload event.
        game.evaluateJavascript("window.dispatchEvent(new Event('beforeunload'));", null);
        game.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (game != null) game.onResume();
    }
    @Override public void onSaveInstanceState(Bundle state) {
        game.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override public void onBackPressed() {
        if (connectionMessage.getVisibility() == View.VISIBLE) { finish(); return; }
        // Close the game's open dialog before leaving the activity.
        game.evaluateJavascript("(function(){" +
            "var pairs=[['dlgShuffle','btnCancelShuffle'],['dlgHelp','btnCloseHelp'],['dlgMenu','btnCloseMenu']];" +
            "for(var i=0;i<pairs.length;i++){var d=document.getElementById(pairs[i][0]);" +
            "if(d&&!d.hidden){document.getElementById(pairs[i][1]).click();return true;}}return false;" +
            "})()", handled -> { if (!"true".equals(handled)) finish(); });
    }
    @Override protected void onDestroy() {
        game.destroy();
        super.onDestroy();
    }
}
